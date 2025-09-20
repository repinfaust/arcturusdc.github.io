export default function FeatureCard({ code, title, desc, href }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="badge" aria-hidden>
        {code}
      </span>
      <div>
        <h3 className="font-extrabold">{title}</h3>
        <div className="text-muted text-sm">{desc}</div>
        {href && (
          <a
            className="btn btn-secondary mt-2 inline-flex"
            href={href}
            data-analytics="link"
            data-name={`Feature: ${title}`}
            data-component="FeatureCard"
            data-location="body"
          >
            Learn more
          </a>
        )}
      </div>
    </div>
  );
}
