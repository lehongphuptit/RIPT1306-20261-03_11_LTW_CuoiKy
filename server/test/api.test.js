import fs from "node:fs";
import path from "node:path";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import {
  connect,
  User,
  Post,
  Like,
  Comment,
  Notification,
  Report,
  Follow,
} from "../src/models.js";
import { createApp } from "../src/app.js";
import { issue } from "../src/core.js";
let repl, app, a, b, c, owner;
const api = (method, path, token) => {
  const r = request(app)[method]("/api" + path);
  return token ? r.set("Authorization", "Bearer " + token) : r;
};
const payload = {
  title: "Một chuyến đi đáng nhớ",
  content: "Rất đẹp #HộiAn #hoian",
  location: { name: "Hội An" },
  tripDate: "2026-01-01",
  cost: 100000,
  visibility: "public",
};
before(
  async () => {
    process.env.JWT_SECRET = "test-secret-only-".repeat(4);
    fs.mkdirSync(".test-db", { recursive: true });
    const dbPath = fs.mkdtempSync(path.resolve(".test-db/run-"));
    repl = await MongoMemoryReplSet.create({
      instanceOpts: [{ dbPath }],
      replSet: { count: 1 },
    });
    await connect(repl.getUri("travel_diary_test"));
    app = createApp();
    for (const name of ["alice", "bob", "carol"]) {
      const r = await api("post", "/auth/register").send({
        email: name + "@example.com",
        username: name,
        displayName: name,
        password: "TestPass123",
        role: "admin",
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      assert.equal(r.body.user.role, "member");
      if (name === "alice") a = r.body;
      if (name === "bob") b = r.body;
      if (name === "carol") c = r.body;
    }
    owner = await User.create({
      username: "owner",
      displayName: "Owner",
      email: "owner@example.com",
      passwordHash: "not-used",
      role: "admin",
      isOwner: true,
    });
    owner = { user: owner, token: issue(owner) };
  },
  { timeout: 180000 },
);
after(async () => {
  await mongoose.disconnect();
  await repl?.stop();
});
test("Auth: login, public fields, rejected forged admin, wrong credentials", async () => {
  assert.equal(
    (
      await api("post", "/auth/login").send({
        email: "alice@example.com",
        password: "TestPass123",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await api("post", "/auth/login").send({
        email: "alice@example.com",
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal((await api("get", "/admin/users", a.token)).status, 403);
  assert.equal((await api("get", "/auth/me")).status, 401);
  const r = await api("get", "/users");
  assert.equal(r.status, 200);
  assert.ok(r.body.data.every((u) => !u.passwordHash && !u.email));
});
test("Private post: guest/nonfollower 404, follow unlocks, unfollow revokes; no self follow", async () => {
  const r = await api("post", "/posts", a.token).send({
    ...payload,
    visibility: "followers",
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const id = r.body.post._id;
  assert.equal((await api("get", "/posts/" + id)).status, 404);
  assert.equal((await api("get", "/posts/" + id, b.token)).status, 404);
  assert.equal(
    (await api("put", "/users/" + b.user._id + "/follow", b.token)).status,
    400,
  );
  assert.equal(
    (await api("put", "/users/" + a.user._id + "/follow", b.token)).status,
    200,
  );
  assert.equal((await api("get", "/posts/" + id, b.token)).status, 200);
  assert.equal(
    (await api("patch", "/posts/" + id, b.token).send({ title: "Not my post" }))
      .status,
    403,
  );
  await api("delete", "/users/" + a.user._id + "/follow", b.token);
  assert.equal((await api("get", "/posts/" + id, b.token)).status, 404);
  assert.equal((await api("get", "/posts/" + id, owner.token)).status, 200);
});
test("Like uniqueness, comment root normalization, reports and hide/unhide, locked author", async () => {
  let r = await api("post", "/posts", a.token).send(payload);
  const id = r.body.post._id;
  const likes = await Promise.all(
    Array.from({ length: 3 }, () =>
      api("put", "/posts/" + id + "/like", b.token),
    ),
  );
  assert.ok(
    likes.every((r) => r.status === 200),
    JSON.stringify(likes.map((r) => r.body)),
  );
  assert.equal(await Like.countDocuments({ post: id, user: b.user._id }), 1);
  assert.equal(
    await Notification.countDocuments({ post: id, type: "like" }),
    1,
  );
  r = await api("post", "/posts/" + id + "/comments", b.token).send({
    content: "Root",
  });
  assert.equal(r.status, 201);
  const root = r.body.comment._id;
  r = await api("post", "/posts/" + id + "/comments", a.token).send({
    content: "Reply",
    parentId: root,
  });
  const reply = r.body.comment._id;
  r = await api("post", "/posts/" + id + "/comments", b.token).send({
    content: "Reply again",
    parentId: reply,
  });
  assert.equal(r.body.comment.parent, root);
  assert.equal((await api("delete", "/comments/" + root, c.token)).status, 403);
  assert.equal((await api("delete", "/comments/" + root, a.token)).status, 204);
  assert.equal(await Comment.countDocuments({ post: id }), 0);
  for (const token of [b.token, c.token])
    assert.equal(
      (
        await api("post", "/posts/" + id + "/reports", token).send({
          reason: "spam",
        })
      ).status,
      201,
    );
  assert.equal(
    (
      await api("post", "/posts/" + id + "/reports", b.token).send({
        reason: "spam",
      })
    ).status,
    409,
  );
  const report = await Report.findOne({ post: id });
  assert.equal(
    (
      await api("patch", "/admin/reports/" + report._id, owner.token).send({
        action: "hide",
      })
    ).status,
    200,
  );
  assert.equal(await Report.countDocuments({ post: id, status: "pending" }), 0);
  assert.equal((await api("get", "/posts/" + id, b.token)).status, 404);
  assert.equal((await api("get", "/posts/" + id, a.token)).status, 200);
  await api("patch", "/admin/posts/" + id + "/status", owner.token).send({
    status: "active",
  });
  assert.equal((await api("get", "/posts/" + id)).status, 200);
  await api("patch", "/admin/users/" + a.user._id, owner.token).send({
    locked: true,
  });
  assert.ok(
    [401, 403].includes((await api("get", "/auth/me", a.token)).status),
  );
  assert.equal((await api("get", "/posts/" + id)).status, 404);
  await api("patch", "/admin/users/" + a.user._id, owner.token).send({
    locked: false,
  });
  assert.equal((await api("get", "/auth/me", a.token)).status, 401);
  a.token = (
    await api("post", "/auth/login").send({
      email: "alice@example.com",
      password: "TestPass123",
    })
  ).body.token;
  assert.equal((await api("get", "/posts/" + id)).status, 200);
  assert.equal((await api("delete", "/posts/" + id, a.token)).status, 204);
  for (const M of [Like, Comment, Notification, Report])
    assert.equal(await M.countDocuments({ post: id }), 0);
});
test("Validation, search, cursor, feed, stats, notification ownership, logout invalidation", async () => {
  assert.equal(
    (await api("post", "/posts", a.token).send({ ...payload, cost: -1 }))
      .status,
    400,
  );
  assert.equal(
    (
      await api("post", "/posts", a.token).send({
        ...payload,
        tripDate: "2999-01-01",
      })
    ).status,
    400,
  );
  assert.equal(
    (await api("post", "/posts", owner.token).send(payload)).status,
    403,
  );
  for (let i = 0; i < 3; i++)
    assert.equal(
      (await api("post", "/posts", a.token).send(payload)).status,
      201,
    );
  let r = await api("get", "/posts?limit=1&q=hoi%20an");
  assert.equal(r.body.data.length, 1);
  assert.ok(r.body.nextCursor);
  const second = await api("get", "/posts?limit=1&cursor=" + r.body.nextCursor);
  assert.notEqual(second.body.data[0]._id, r.body.data[0]._id);
  assert.equal((await api("get", "/posts?cursor=garbage")).status, 400);
  assert.equal((await api("get", "/feed", a.token)).status, 200);
  r = await api("get", "/admin/stats", owner.token);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(r.body.locations.length);
  const n = await Notification.create({
    recipient: a.user._id,
    actor: b.user._id,
    type: "follow",
  });
  assert.equal(
    (await api("patch", "/notifications/" + n._id + "/read", b.token)).status,
    404,
  );
  assert.equal(
    (await api("patch", "/notifications/" + n._id + "/read", a.token)).status,
    200,
  );
  assert.equal(
    (
      await api("patch", "/admin/users/" + owner.user._id, owner.token).send({
        locked: true,
      })
    ).status,
    400,
  );
  await api("post", "/auth/logout", c.token);
  assert.equal((await api("get", "/auth/me", c.token)).status, 401);
});

test("Upload rejects invalid MIME and fake image bytes; password change revokes token", async () => {
  const fields = {
    title: payload.title,
    content: payload.content,
    location: JSON.stringify(payload.location),
    tripDate: payload.tripDate,
    cost: String(payload.cost),
  };
  let r = await api("post", "/posts", a.token)
    .field(fields)
    .attach("images", Buffer.from("hello"), {
      filename: "bad.txt",
      contentType: "text/plain",
    });
  assert.equal(r.status, 400);
  r = await api("post", "/posts", a.token)
    .field(fields)
    .attach("images", Buffer.from("fake-image"), {
      filename: "bad.png",
      contentType: "image/png",
    });
  assert.equal(r.status, 400);
  r = await api("patch", "/auth/password", b.token).send({
    currentPassword: "TestPass123",
    newPassword: "ChangedPass123",
  });
  assert.equal(r.status, 200);
  assert.equal((await api("get", "/auth/me", b.token)).status, 401);
  assert.equal(
    (
      await api("post", "/auth/login").send({
        email: "bob@example.com",
        password: "ChangedPass123",
      })
    ).status,
    200,
  );
});
