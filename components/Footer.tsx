export default function Footer() {
  return (
    <footer className="border-t border-hairline mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-faint">
          Public-record lookups only. Not legal, financial, or compliance
          advice.
        </p>
        <p className="text-xs text-faint">
          Developed by{" "}
          <a
            href="https://www.linkedin.com/in/chidozieezeanekwe/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-brass transition-colors"
          >
            Chidozie Ezeanekwe
          </a>
        </p>
      </div>
    </footer>
  );
}
