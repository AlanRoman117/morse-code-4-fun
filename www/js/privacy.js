document.addEventListener('DOMContentLoaded', function() {
    // --- Theme application logic ---
    // Applies theme based on localStorage. Assumes 'body.privacy-page' handles light theme by default via CSS,
    // and 'body.privacy-page.dark-theme' provides dark theme overrides.
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (savedTheme === 'light') {
            // Light theme is default via .privacy-page CSS, so ensure .dark-theme is not present.
            document.body.classList.remove('dark-theme');
        } else {
            // Default: if no theme is set in localStorage, or it's an unexpected value,
            // match main app's default behavior (which is dark).
            document.body.classList.add('dark-theme');
        }
    } catch (e) {
        console.error("Error applying theme from localStorage to privacy page:", e);
        // Fallback to dark theme in case of error (e.g., localStorage access denied)
        document.body.classList.add('dark-theme');
    }
    // --- End Theme application logic ---

    const privacyPolicyContentDiv = document.getElementById('privacyPolicyContent');
    if (!privacyPolicyContentDiv) {
        console.error('Privacy policy content div not found.');
        return;
    }

    // Fetch the privacy policy Markdown file
    // Adjust the path if privacy_policy.md is not in the root of the www folder
    // For Capacitor, files outside www need to be accessed via native file reading
    // or be moved into www during the build process.
    // For now, assuming privacy_policy.md will be moved to www or accessed differently.
    // Let's assume it's at the root of the app, accessible via a relative path from www.
    // fetch('../privacy_policy.md') // Old path
    fetch('assets/privacy_policy.md') // New path, relative to index.html in www
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching privacy_policy.md`);
            }
            return response.text();
        })
        .then(markdown => {
            privacyPolicyContentDiv.innerHTML = simpleMarkdownToHtml(markdown);
        })
        .catch(error => {
            console.error('Error fetching or parsing privacy policy:', error);
            privacyPolicyContentDiv.innerHTML = '<p>Could not load the privacy policy at this time. Please try again later.</p>';
        });
});

function simpleMarkdownToHtml(markdown) {
    let html = markdown;

    // Headers (e.g., # Header, ### Header)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold (e.g., **text**)
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Italic (e.g., *text*) - Not used in the provided policy, but good to have
    // html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Links (e.g., [text](url))
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');

    // Lists (e.g., * item or - item)
    // This is a bit more complex for a simple regex.
    // This will handle simple lists where each item is on a new line starting with * or -
    html = html.split('\n').map(line => {
        if (line.match(/^\* (.*)/)) {
            return `<li>${line.substring(2)}</li>`;
        }
        return line;
    }).join('\n');
    // Wrap consecutive <li> items in <ul>
    html = html.replace(/<li>(.*?)<\/li>\n(<li>(.*?)<\/li>\n)*/gim, (match) => `<ul>${match.replace(/\n$/, "")}</ul>`);
    // Clean up any potential empty <ul></ul> tags if lists are not perfectly formatted
    html = html.replace(/<ul>\s*<\/ul>/gim, '');


    // Paragraphs (simple approach: wrap lines that are not headers or list items)
    // This needs to be smarter, typically by splitting by \n\n
    // For now, let's wrap remaining lines in <p> tags if they are not already part of other elements
    // This is a very naive paragraph handler and might mis-format.
    // A more robust solution would split by double line breaks then process each block.
    html = html.split(/\n\s*\n/).map(paragraph => { // Split by one or more empty lines
        const trimmedParagraph = paragraph.trim();
        if (trimmedParagraph.length === 0) {
            return '';
        }
        if (trimmedParagraph.startsWith('<h') || trimmedParagraph.startsWith('<ul') || trimmedParagraph.startsWith('<li')) {
            return trimmedParagraph; // Already formatted
        }
        return `<p>${trimmedParagraph.replace(/\n/g, '<br>')}</p>`; // Replace single newlines in paragraphs with <br>
    }).join('\n');


    // Replace newline characters with <br> for lines not part of other block elements
    // This should be done carefully. The paragraph logic above handles most cases.
    // html = html.replace(/\n/g, '<br>'); // Too broad, might break existing HTML structure

    return html;
}
