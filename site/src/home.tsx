import { Install, Shell } from './shell';
import { GITHUB, KIND_LIST } from './skills';

/** One line about the site, for the page's meta. */
export const SUMMARY =
  'Interface, interaction design and UX skills for coding agents.';

export function HomePage() {
  return (
    <Shell>
      <div className="hero">
        <p className="lead">
          Interface, interaction design and UX skills for coding agents. Each
          one tells your agent how an interface should behave, in numbers, so
          what it builds feels right the first time.
        </p>
      </div>

      <section id="install">
        <div className="label">Install</div>
        <h2>Add them all</h2>
        <p>
          Your agent downloads each skill into the folder it loads skills from.
          To add only some, tell it which.
        </p>
        <Install />
      </section>

      {KIND_LIST.map(({ id, name, heading, text, skills }) => (
        <section key={id} id={id}>
          <div className="label">{name}</div>
          {heading && <h2>{heading}</h2>}
          {text && <p>{text}</p>}
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>For</th>
                </tr>
              </thead>
              <tbody>
                {skills.map(({ name, summary, path }) => (
                  <tr key={name}>
                    <td>
                      <a href={`${GITHUB}/tree/main/${path}`}>
                        <code>{name}</code>
                      </a>
                    </td>
                    <td>{summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </Shell>
  );
}
