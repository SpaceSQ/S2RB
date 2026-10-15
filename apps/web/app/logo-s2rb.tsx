export const LogoS2RB = ({ className = "logo-s2rb" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="S2RB"
    >
      <path fill="#00f3ff" d="M4 22H34V34H16V86H34V98H4Z" />
      <path fill="#00f3ff" d="M112 22H82V34H100V86H82V98H112Z" />
      <line
        x1="26"
        y1="47"
        x2="88"
        y2="47"
        stroke="#ff0055"
        strokeWidth="6"
        strokeDasharray="14 10"
        strokeLinecap="butt"
      />
      <line
        x1="26"
        y1="73"
        x2="88"
        y2="73"
        stroke="#00f3ff"
        strokeWidth="6"
        strokeDasharray="14 10"
        strokeLinecap="butt"
      />
      <circle cx="136" cy="60" r="13" fill="none" stroke="#00f3ff" strokeWidth="5" />
      <circle cx="136" cy="60" r="5" fill="#00f3ff" />
      <text
        x="162"
        y="62"
        fill="#ffffff"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        fontWeight="700"
        fontSize="40"
      >
        S2RB
      </text>
      <text
        x="162"
        y="90"
        fill="#00f3ff"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        fontWeight="700"
        fontSize="18"
      >
        {"> ZERO_TRUST_PROXY"}
      </text>
    </svg>
  );
};
