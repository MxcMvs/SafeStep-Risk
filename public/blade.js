(function () {
  function setupBlade() {
    const blade = document.querySelector('.blade');
    const sidebar = document.getElementById('sidebar');
    if (!blade || !sidebar) return;

    blade.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    sidebar.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => sidebar.classList.remove('active'));
    });


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
