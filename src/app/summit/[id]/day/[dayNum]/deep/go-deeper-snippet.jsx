// Add this block in page.jsx immediately after the </DayGuard> closing tag (line 381)
// and before the Stage navigation div.
// It shows a quiet "Go Deeper" link once the user has completed the mission.

{missionComplete && (
  <div style={{ textAlign: 'center', marginTop: 24 }}>
    <Link
      href={`/summit/${id}/day/${dayNum}/deep`}
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.75rem',
        color: 'rgba(25,190,227,0.55)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'color 0.2s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-teal)'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(25,190,227,0.55)'}
    >
      Want to go deeper? →
    </Link>
  </div>
)}
