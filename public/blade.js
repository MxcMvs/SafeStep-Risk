// blade.js
(function () {
  function setupBlade() {
    const blade = document.querySelector('.blade');
    const sidebar = document.getElementById('sidebar');
    if (!blade || !sidebar) return;

    // Click to open/close
    blade.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    // Close when a link is clicked
    sidebar.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => sidebar.classList.remove('active'));
    });

    // Expose a global (for inline onclick on some pages)
    window.toggleMenu = function () {
      sidebar.classList.toggle('active');
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupBlade);
  } else {
    setupBlade();
  }
})();
