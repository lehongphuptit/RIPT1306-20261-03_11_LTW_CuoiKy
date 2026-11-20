import { Link } from 'react-router-dom';

export default function TaggedText({ text = '' }) {
  return text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, index) =>
    index % 2 ? <Link key={index} className="journal-hashtag" to={'/?q=' + encodeURIComponent(part)}>{part}</Link> : part
  );
}
