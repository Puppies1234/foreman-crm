// Shared drill-down list for all 4 Dashboard stat cards — which list is
// which comes from ?type=, REVIEW_LISTS (js/data.js) owns the data side
// (source array, id, storage key), this file only owns row presentation.
whenAppReady(() => {
  const type = new URLSearchParams(window.location.search).get("type");
  const list = REVIEW_LISTS[type];

  if (!list) {
    document.getElementById("review-title").textContent = "Not Found";
    document.getElementById("review-subtitle").textContent = "This review list doesn't exist.";
    return;
  }

  render(type, list);
});

function render(type, list) {
  document.title = `${list.title} — ${getBrand().name}`;
  document.getElementById("review-title").textContent = list.title;

  const items = list.getItems().filter(item => !isReviewChecked(type, list.getId(item)));
  const subtitleEl = document.getElementById("review-subtitle");
  const listEl = document.getElementById("review-list");

  if (items.length === 0) {
    subtitleEl.textContent = "All caught up.";
    listEl.innerHTML = `<div class="empty-note review-empty">All caught up.</div>`;
    return;
  }

  subtitleEl.textContent = `${items.length} item${items.length === 1 ? "" : "s"} to review`;
  listEl.innerHTML = items.map(item => renderRow(type, item)).join("");

  listEl.querySelectorAll(".review-row").forEach(row => {
    const id = row.getAttribute("data-id");
    const href = row.getAttribute("data-href");
    const checkbox = row.querySelector(".review-checkbox");

    // Checking marks the item done (and re-renders, which drops it from
    // the list); clicking anywhere else on the row navigates instead.
    checkbox.addEventListener("click", e => e.stopPropagation());
    checkbox.addEventListener("change", () => {
      // Saved to the job in Supabase (or, for follow-ups, localStorage). If
      // the save fails it's rolled back, and re-rendering puts it back.
      setReviewChecked(type, id, true).then(r => { if (r.error) render(type, list); });
      render(type, list);
    });

    row.addEventListener("click", e => {
      if (e.target === checkbox) return;
      window.location.href = href;
    });
  });
}

function reviewRowContent(type, item) {
  if (type === "leads") {
    const job = item;
    const contact = getContact(job.contact_id);
    return {
      job,
      title: `Job #${job.job_number} — ${job.service_type}`,
      meta: `${contact.full_name} · ${formatDateOnly(job.date)}`,
    };
  }
  if (type === "appointments") {
    const job = getJob(item.job_id);
    const contact = getContact(job.contact_id);
    return {
      job,
      title: `${formatTime(item.start_time)} – ${formatTime(item.end_time)} · ${job.service_type}`,
      meta: `${contact.full_name} · ${job.assigned_to}`,
    };
  }
  if (type === "followups") {
    const job = getJob(item.job_id);
    const contact = getContact(job.contact_id);
    return {
      job,
      title: `${item.channel} follow-up — ${job.service_type}`,
      meta: `${contact.full_name} · ${item.content}`,
    };
  }
  // priority
  const job = getJob(item.job_id);
  const contact = getContact(job.contact_id);
  return {
    job,
    title: `Unconfirmed appointment — ${job.service_type}`,
    meta: `${contact.full_name} · ${formatDateTime(item.start_time)}`,
  };
}

function renderRow(type, item) {
  const list = REVIEW_LISTS[type];
  const id = list.getId(item);
  const { job, title, meta } = reviewRowContent(type, item);

  return `
    <div class="review-row" data-id="${id}" data-href="contact.html?job=${job.id}">
      <input type="checkbox" class="review-checkbox" aria-label="Mark ${list.verb}">
      <div class="review-row-body">
        <div class="review-row-title">${escapeHtml(title)}</div>
        <div class="review-row-meta">${escapeHtml(meta)}</div>
      </div>
      ${chevronIcon()}
    </div>
  `;
}
