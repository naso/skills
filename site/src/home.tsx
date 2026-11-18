import { Install, Shell } from './shell';
import { GITHUB, KIND_LIST } from './skills';

/** One line about the site, for the page's meta. */
export const SUMMARY =
  'Interface, interaction design and UX skills for coding agents.';

export function HomePage() {
  return (
    <Shell>
      <div className="hero">
        <div className="lead">
          <h1>Interface, interaction design and UX skills for coding agents</h1>
          <p>
            Each one tells your agent how an interface should behave, in
            numbers, so what it builds feels right the first time.
          </p>
        </div>
        <Install />
      </div>

      {/* The skills as a table, a group for each kind, whose row naming it
          stays in view while its skills scroll by. */}
      <section>
        <div className="skills" role="table" aria-label="Skills">
          {KIND_LIST.map(({ id, name, skills }, index) => (
            <div key={id} className="kind" role="rowgroup">
              <div className="kind-name" role="row">
                <span role="columnheader" aria-colspan={2}>
                  {name}
                </span>
              </div>
              {skills.map(({ name, summary, path }) => (
                <div key={name} className="skill skill-link" role="row">
                  <span role="cell">
                    <a href={`${GITHUB}/tree/main/${path}`}>
                      <code>{name}</code>
                    </a>
                  </span>
                  <span role="cell">{summary}</span>
                </div>
              ))}
              {/* A skill still to come, after the last kind's skills. */}
              {index === KIND_LIST.length - 1 && (
                <div
                  className="skill skill-soon"
                  role="row"
                  aria-label="More skills, coming soon"
                >
                  <span role="cell">
                    <code className="soon">more soon</code>
                  </span>
                  <span role="cell" aria-hidden>
                    <span className="skeleton" />
                    <span className="skeleton" style={{ width: '60%' }} />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
