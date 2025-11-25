export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Always use light mode only
              document.documentElement.classList.remove('dark');
              localStorage.setItem('theme', 'light');
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}
