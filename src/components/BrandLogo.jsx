'use client'

import Link from 'next/link'

/**
 * Brand wordmark: SummitSkills as one token (no space between halves).
 * Icon gap is controlled only by .logo-img margin-right in CSS.
 */
export function LogoWordmark() {
  // No whitespace between halves — JSX newlines become real spaces in the DOM
  return (
    <span className="logo-wordmark" aria-label="SummitSkills">
      <span className="logo-summit">Summit</span><span className="logo-skills">Skills</span>
    </span>
  )
}

/**
 * Full nav logo: icon + SummitSkills wordmark.
 * @param {string} href - destination (default /library)
 * @param {string} className - usually "logo"
 * @param {'link'|'a'} as - Next Link vs plain anchor (landing uses "a")
 * @param {function} onImgError - optional img onError (landing hides broken icon)
 * @param {object} imgStyle - optional inline styles for the icon
 */
export default function BrandLogo({
  href = '/library',
  className = 'logo',
  as = 'link',
  onImgError,
  imgStyle,
  showIcon = true,
}) {
  const inner = (
    <>
      {showIcon && (
        <img
          src="/SummitSkills-Logo.png"
          alt=""
          className="logo-img"
          style={imgStyle}
          onError={onImgError}
        />
      )}
      <LogoWordmark />
    </>
  )

  if (as === 'a') {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}
