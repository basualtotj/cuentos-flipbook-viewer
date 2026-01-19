// public/js/flipbook.js
$(document).ready(function () {
  const totalPages = (window.__BOOK__ && window.__BOOK__.totalPages) || 20;

  const $fb = $('#flipbook');
  const w = $fb.width();
  const h = $fb.height();

  $fb.turn({
    width: w,
    height: h,
    autoCenter: true,
    duration: 900,
    gradients: true,
    acceleration: true
  });

  function update() {
    const page = $fb.turn('page');
    $('#page-info').text(`Página ${page} de ${totalPages}`);
    $('#prev').prop('disabled', page === 1);
    $('#next').prop('disabled', page === totalPages);
  }

  $fb.bind('turned', update);

  $('#prev').click(() => $fb.turn('previous'));
  $('#next').click(() => $fb.turn('next'));

  update();

  // Si cambia tamaño (móvil / resize), recalcula turn
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const nw = $fb.width();
      const nh = $fb.height();
      $fb.turn('size', nw, nh);
    }, 150);
  });
});