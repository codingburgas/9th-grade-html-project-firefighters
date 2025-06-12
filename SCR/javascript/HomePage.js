function toggleColorMode()
{
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('colorMode', isDark ? 'dark' : 'light');
}

// Apply saved mode on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode === 'dark')
        {
        document.body.classList.add('dark-mode');
    }
});
