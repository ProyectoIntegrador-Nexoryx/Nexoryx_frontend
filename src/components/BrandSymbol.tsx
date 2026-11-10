function BrandSymbol({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M9 9 31 31M31 9 9 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="9" cy="9" r="3" fill="currentColor" />
      <circle cx="31" cy="9" r="3" fill="currentColor" />
      <circle cx="9" cy="31" r="3" fill="currentColor" />
      <circle cx="31" cy="31" r="3" fill="currentColor" />
      <circle cx="20" cy="20" r="4" fill="currentColor" />
    </svg>
  );
}

export default BrandSymbol;
