import styles from "./loading-experience.module.css";

export function LoadingExperience({
  title = "Getting things ready",
  message = "Connecting the pieces for you.",
  compact = false,
}: {
  title?: string;
  message?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`${styles.loader} ${compact ? styles.compact : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.visual} aria-hidden="true">
        <div className={styles.orbit}>
          <span className={`${styles.node} ${styles.nodeOne}`} />
          <span className={`${styles.node} ${styles.nodeTwo}`} />
          <span className={`${styles.node} ${styles.nodeThree}`} />
          <div className={styles.core}>
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M6 25h8l3.2-7 5.5 14 4.4-9 3.1 5H42" />
            </svg>
          </div>
        </div>

        <div className={styles.careTiles}>
          <span className={styles.tile}>CARE</span>
          <span className={styles.tile}>MATCH</span>
          <span className={styles.tile}>READY</span>
        </div>
      </div>

      <div className={styles.copy}>
        <p className={styles.eyebrow}>HEALTHCARE CENTRAL</p>
        <strong>{title}</strong>
        <span>{message}</span>

        <div className={styles.progress} aria-hidden="true">
          <span />
        </div>

        <div className={styles.steps} aria-hidden="true">
          <span>Checking services</span>
          <span>Connecting information</span>
          <span>Preparing your view</span>
        </div>
      </div>
    </div>
  );
}
