// Surface Interaction Controller (Brand & Creator Dashboards)
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
});

// Toast system
window.showToast = function(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'naano-toast';
  t.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${msg}</span>
  `;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
    t.style.transition = 'all 0.25s ease';
    setTimeout(() => t.remove(), 250);
  }, 3500);
};

// 1. Tab Switching
function initTabs() {
  const tabBtns = document.querySelectorAll('.s-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });

      const targetPane = document.getElementById(`tab-${tabKey}`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
}

// 2. Creator Filtering
window.filterCreators = function() {
  const icp = document.getElementById('icpFilter')?.value || 'all';
  const maxPrice = document.getElementById('budgetFilter')?.value || 'all';

  const cards = document.querySelectorAll('.creator-card');
  cards.forEach(card => {
    const cardIcp = card.dataset.icp;
    const cardPrice = parseInt(card.dataset.price);

    let matchIcp = (icp === 'all' || cardIcp === icp);
    let matchPrice = true;
    if (maxPrice !== 'all') {
      const p = parseInt(maxPrice);
      if (p === 500) matchPrice = cardPrice <= 500;
      else if (p === 1000) matchPrice = cardPrice > 500 && cardPrice <= 1000;
      else if (p === 2000) matchPrice = cardPrice > 1000;
    }

    card.style.display = (matchIcp && matchPrice) ? 'flex' : 'none';
  });
};

// 3. Add to Campaign Roster
window.addToCampaign = function(name, price, avatar) {
  const list = document.getElementById('campaignRosterList');
  if (!list) return;

  const item = document.createElement('div');
  item.className = 'roster-item';
  item.innerHTML = `
    <img src="${avatar}" alt="${name}" />
    <div class="r-details">
      <strong>${name}</strong>
      <span>1 LinkedIn Post</span>
    </div>
    <span class="r-price">€${price.toFixed(2)}</span>
  `;
  list.appendChild(item);
  window.showToast(`Added ${name} (€${price}) to your active campaign roster!`);

  // Switch to Brief tab
  document.querySelector('.s-tab-btn[data-tab="briefs"]')?.click();
};

// 4. Lock Escrow & Dispatch
window.lockEscrowAndDispatch = function() {
  window.showToast('Escrow funds locked securely in Stripe Escrow. Briefs dispatched to creators!');
  setTimeout(() => {
    document.querySelector('.s-tab-btn[data-tab="approvals"]')?.click();
  }, 1200);
};

// 5. Content Approval Actions
window.approveDraft = function(cardId, creatorName) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const badge = card.querySelector('.status-badge');
  if (badge) {
    badge.className = 'status-badge live';
    badge.textContent = 'Approved for Publish';
  }

  const actions = card.querySelector('.review-actions-bar');
  if (actions) {
    actions.innerHTML = `
      <div style="width:100%;text-align:center;padding:10px;background:#ECFDF5;border-radius:10px;color:#065F46;font-weight:600;font-size:13.5px;">
        ✓ Post Approved. Scheduled for live auto-dispatch. Escrow unlocked on publish.
      </div>
    `;
  }

  window.showToast(`Approved draft by ${creatorName}! Attributed token injected.`);
};

window.requestRevision = function(creatorName) {
  const comment = prompt(`Enter revision feedback for ${creatorName}:`, 'Please mention our native CRM sync in bullet point 2.');
  if (comment) {
    window.showToast(`Revision note sent to ${creatorName}`);
  }
};

// 6. Creator Editor Live Preview
window.updateLinkedInPreview = function() {
  const input = document.getElementById('postCopyInput');
  const preview = document.getElementById('livePostPreviewText');
  if (input && preview) {
    preview.innerHTML = input.value.replace(/\n/g, '<br/>');
  }
};

window.submitDraftToBrand = function() {
  window.showToast('Draft submitted to Brand team for compliance & hook review!');
};

window.acceptDeal = function(brandName) {
  window.showToast(`Deal accepted from ${brandName}! Slot locked in calendar.`);
};
