/**
 * Blacklist Page Layout
 * 
 * Special layout for blacklist page to:
 * 1. Hide the global Header component
 * 2. Use standalone design for bumpinblacklist.com
 * 3. Provide clean, public-facing interface
 */

export default function BlacklistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout intentionally has NO <Header /> component
  // The blacklist page renders its own header inline
  return <>{children}</>;
}

