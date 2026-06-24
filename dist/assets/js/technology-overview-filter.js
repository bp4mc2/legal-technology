(function () {
  const zoek    = document.getElementById('lt-zoek');
  const ftype   = document.getElementById('lt-filter-type');
  const fstatus = document.getElementById('lt-filter-status');
  const count   = document.getElementById('lt-count');
  const tbody   = document.querySelector('#lt-tabel tbody');

  function filter() {
    const q  = (zoek?.value || '').toLowerCase();
    const ft = ftype?.value  || '';
    const fs = fstatus?.value || '';
    let n = 0;
    tbody.querySelectorAll('tr[data-type]').forEach(tr => {
      const tekst = tr.textContent.toLowerCase();
      const zichtbaar =
        (!q  || tekst.includes(q))  &&
        (!ft || tr.dataset.type   === ft) &&
        (!fs || tr.dataset.status === fs);
      tr.hidden = !zichtbaar;
      if (zichtbaar) n++;
    });
    if (count) count.textContent = n + ' tool' + (n !== 1 ? 's' : '');
  }

  zoek?.addEventListener('input', filter);
  ftype?.addEventListener('change', filter);
  fstatus?.addEventListener('change', filter);
})();