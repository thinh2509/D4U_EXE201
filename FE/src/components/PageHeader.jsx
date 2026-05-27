export function PageHeader({ icon, title, description, extra, eyebrow }) {
  return (
    <div className="page-header">
      <div className="page-title-wrap">
        {icon && <div className="page-icon">{icon}</div>}
        <div>
          {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {extra && <div className="page-extra">{extra}</div>}
    </div>
  );
}
