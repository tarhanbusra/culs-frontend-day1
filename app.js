// Loads herbs from data/herbs.json, then wires up search, filter, modal & favourites.

// ─── DOM references ──────────────────────────────────────────────────────────
const list = document.querySelector("#herbs-list")
const count = document.querySelector(".count")
const searchInput = document.querySelector("#herb-search")
const filterBtns = document.querySelectorAll(".filter-btn")

const modal = document.querySelector("#herb-modal")
const modalTitle = document.querySelector("#modal-title")
const modalLatin = document.querySelector(".modal-latin")
const modalUse = document.querySelector(".modal-use")
const modalBadge = document.querySelector(".herb-modal .badge")
const closeBtn = document.querySelector(".close-btn")
const favBtn = document.querySelector("#fav-btn")
const favIcon = document.querySelector(".fav-icon")
const favLabel = document.querySelector(".fav-label")
const modalIllustration = document.querySelector("#modal-illustration")
const prevBtn = document.querySelector(".prev-btn")
const nextBtn = document.querySelector(".next-btn")

// ─── In-memory state ─────────────────────────────────────────────────────────
let allHerbs = []         // full dataset, populated once after fetch
let activeFilter = "all"
let currentHerb = null    // herb currently shown in the modal
let currentModalIndex = -1  // index within the current filtered list
let visibleHerbsSnapshot = [] // snapshot of filtered list taken when modal opens

// ─── LocalStorage helpers ────────────────────────────────────────────────────
const STORAGE_KEY = "favoriteHerbs"

function getFavourites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function isFavourite(name) {
  return getFavourites().includes(name)
}

function toggleFavourite(name) {
  const favs = getFavourites()
  const idx = favs.indexOf(name)
  if (idx === -1) {
    favs.push(name)
  } else {
    favs.splice(idx, 1)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
}

// ─── Data loading ────────────────────────────────────────────────────────────
async function loadHerbs() {
  const response = await fetch("data/herbs.json")
  if (!response.ok) {
    throw new Error(`Could not load ${response.url}: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// ─── Card builder ────────────────────────────────────────────────────────────
function element(tag, className, text) {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

function card(herb) {
  const item = element("li", "card", "")
  item.dataset.name = herb.name          // used for event delegation
  item.setAttribute("role", "button")
  item.setAttribute("tabindex", "0")
  item.setAttribute("aria-label", `View details for ${herb.name}`)

  // Star badge — rendered but toggled by CSS class
  const star = element("span", "card-star", isFavourite(herb.name) ? "★" : "☆")
  star.setAttribute("aria-hidden", "true")

  item.append(
    star,
    element("h3", "name", herb.name),
    element("p", "latin", herb.latin),
    element("p", "use", herb.use),
    element("p", "life", herb.life))

  if (isFavourite(herb.name)) item.classList.add("is-favourite")
  return item
}

// ─── Filtering & sorting logic ───────────────────────────────────────────────
function getFilteredHerbs() {
  const query = searchInput.value.trim().toLowerCase()

  const filtered = allHerbs.filter(herb => {
    const matchesLife = activeFilter === "all" || herb.life === activeFilter
    const matchesQuery = !query
      || herb.name.toLowerCase().includes(query)
      || herb.use.toLowerCase().includes(query)
    return matchesLife && matchesQuery
  })

  // Pinned sort: favourites first, then natural order
  return filtered.sort((a, b) => {
    const aFav = isFavourite(a.name) ? 0 : 1
    const bFav = isFavourite(b.name) ? 0 : 1
    return aFav - bFav   // stable within each group: original JSON order preserved
  })
}

// ─── Render ──────────────────────────────────────────────────────────────────
function render() {
  const results = getFilteredHerbs()

  list.replaceChildren(...results.map(card))

  count.textContent = results.length === allHerbs.length
    ? `${allHerbs.length} herbs grow here.`
    : `Showing ${results.length} of ${allHerbs.length} herbs.`
}

// ─── Botanical SVG illustrations ─────────────────────────────────────────────
// All colours use currentColor or CSS custom properties so dark-mode works.
function botanicalSVG(herb) {
  // Pick a motif based on life-cycle & name keywords
  const name = herb.name.toLowerCase()

  if (name === "lavender") return svgLavender()
  if (name === "chamomile") return svgChamomile()
  if (["rosemary", "thyme", "sage"].includes(name)) return svgShrub()
  if (["basil"].includes(name)) return svgBroadLeaf()
  if (herb.life === "perennial") return svgPerennial()
  return svgAnnual()
}

// Lavender spike
function svgLavender() {
  return `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="50" y1="155" x2="50" y2="60" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="120" x2="35" y2="100" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="50" y1="120" x2="65" y2="100" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="50" cy="55" rx="6" ry="10" fill="currentColor" opacity="0.7"/>
    <ellipse cx="50" cy="43" rx="5" ry="9" fill="currentColor" opacity="0.8"/>
    <ellipse cx="50" cy="32" rx="4" ry="8" fill="currentColor" opacity="0.9"/>
    <ellipse cx="50" cy="22" rx="3" ry="6" fill="currentColor"/>
  </svg>`
}

// Chamomile with petals
function svgChamomile() {
  const petals = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * 36 * Math.PI) / 180
    const x1 = 50 + 12 * Math.cos(angle)
    const y1 = 70 + 12 * Math.sin(angle)
    const x2 = 50 + 26 * Math.cos(angle)
    const y2 = 70 + 26 * Math.sin(angle)
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity="0.85"/>`
  }).join("")
  return `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${petals}
    <circle cx="50" cy="70" r="11" fill="var(--leaf)" opacity="0.9"/>
    <line x1="50" y1="82" x2="50" y2="155" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="120" x2="36" y2="108" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="34" cy="106" rx="5" ry="3" transform="rotate(-30 34 106)" fill="var(--accent)" opacity="0.6"/>
  </svg>`
}

// Woody shrub (rosemary/thyme/sage)
function svgShrub() {
  return `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="50" y1="155" x2="50" y2="95" stroke="var(--soil)" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="130" x2="30" y2="110" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="115" x2="70" y2="95" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="50" cy="75" rx="24" ry="20" fill="var(--accent)" opacity="0.2"/>
    <ellipse cx="30" cy="85" rx="16" ry="13" fill="var(--accent)" opacity="0.3"/>
    <ellipse cx="70" cy="80" rx="16" ry="13" fill="var(--accent)" opacity="0.3"/>
    <ellipse cx="50" cy="60" rx="18" ry="15" fill="var(--accent)" opacity="0.4"/>
    <ellipse cx="50" cy="55" rx="10" ry="9" fill="var(--accent)" opacity="0.6"/>
  </svg>`
}

// Broad-leaf (basil)
function svgBroadLeaf() {
  return `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="50" y1="155" x2="50" y2="50" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
    <path d="M50 90 Q20 60 30 30 Q50 50 50 90Z" fill="currentColor" opacity="0.75"/>
    <path d="M50 90 Q80 60 70 30 Q50 50 50 90Z" fill="currentColor" opacity="0.75"/>
    <path d="M50 130 Q22 105 32 78 Q50 95 50 130Z" fill="currentColor" opacity="0.5"/>
    <path d="M50 130 Q78 105 68 78 Q50 95 50 130Z" fill="currentColor" opacity="0.5"/>
    <line x1="50" y1="90" x2="35" y2="65" stroke="var(--leaf-light)" stroke-width="1" opacity="0.8"/>
    <line x1="50" y1="90" x2="65" y2="65" stroke="var(--leaf-light)" stroke-width="1" opacity="0.8"/>
  </svg>`
}

// Generic perennial (e.g. mint, chives)
function svgPerennial() {
  return `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="50" y1="155" x2="50" y2="30" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="140" x2="32" y2="118" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="50" y1="120" x2="68" y2="98" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="50" y1="100" x2="30" y2="80" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="30" cy="116" rx="9" ry="5" transform="rotate(-40 30 116)" fill="currentColor" opacity="0.7"/>
    <ellipse cx="70" cy="95" rx="9" ry="5" transform="rotate(40 70 95)" fill="currentColor" opacity="0.7"/>
    <ellipse cx="28" cy="78" rx="9" ry="5" transform="rotate(-40 28 78)" fill="currentColor" opacity="0.7"/>
    <circle cx="50" cy="28" r="5" fill="currentColor" opacity="0.9"/>
  </svg>`
}

// Generic annual (e.g. chamomile fallback)
function svgAnnual() {
  return `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="50" y1="155" x2="50" y2="65" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="125" x2="33" y2="108" stroke="var(--accent)" stroke-width="1.5"/>
    <ellipse cx="31" cy="106" rx="7" ry="4" transform="rotate(-45 31 106)" fill="currentColor" opacity="0.65"/>
    <circle cx="50" cy="57" r="14" fill="currentColor" opacity="0.15"/>
    <circle cx="50" cy="57" r="9" fill="currentColor" opacity="0.3"/>
    <circle cx="50" cy="57" r="5" fill="var(--leaf)" opacity="0.9"/>
  </svg>`
}

// ─── Modal: populate content ─────────────────────────────────────────────────
function populateModal(herb) {
  currentHerb = herb
  modalTitle.textContent = herb.name
  modalLatin.textContent = herb.latin
  modalUse.textContent = herb.use
  modalBadge.textContent = herb.life
  modalIllustration.innerHTML = botanicalSVG(herb)
  updateFavBtn()
  updateNavBtns()
}

// ─── Modal: open ─────────────────────────────────────────────────────────────
function openModal(herb) {
  // Snapshot the currently visible list so navigation stays stable
  visibleHerbsSnapshot = getFilteredHerbs()
  currentModalIndex = visibleHerbsSnapshot.findIndex(h => h.name === herb.name)

  populateModal(herb)
  modal.showModal()
}

// ─── Modal: navigate to an index within the snapshot ─────────────────────────
function navigateModal(newIndex) {
  if (newIndex < 0 || newIndex >= visibleHerbsSnapshot.length) return
  currentModalIndex = newIndex
  populateModal(visibleHerbsSnapshot[currentModalIndex])
}

// ─── Modal: update prev/next button disabled state ───────────────────────────
function updateNavBtns() {
  prevBtn.disabled = currentModalIndex <= 0
  nextBtn.disabled = currentModalIndex >= visibleHerbsSnapshot.length - 1
}

// ─── Modal: update favourite button state ────────────────────────────────────
function updateFavBtn() {
  if (!currentHerb) return
  const fav = isFavourite(currentHerb.name)
  favBtn.setAttribute("aria-pressed", String(fav))
  favIcon.textContent = fav ? "★" : "☆"
  favLabel.textContent = fav ? "Remove from favourites" : "Add to favourites"
  favBtn.classList.toggle("is-favourite", fav)
}

// ─── Modal: close ─────────────────────────────────────────────────────────────
function closeModal() {
  modal.close()
}

// Close on ✕ button
closeBtn.addEventListener("click", closeModal)

// Close on backdrop click (the <dialog> element itself, not its content)
modal.addEventListener("click", e => {
  if (e.target === modal) closeModal()
})

// Re-sort and re-render the card gallery ONLY after the modal has fully closed
modal.addEventListener("close", () => {
  currentHerb = null
  currentModalIndex = -1
  visibleHerbsSnapshot = []
  render()
})

// ─── Nav button clicks ───────────────────────────────────────────────────────
prevBtn.addEventListener("click", () => navigateModal(currentModalIndex - 1))
nextBtn.addEventListener("click", () => navigateModal(currentModalIndex + 1))

// Arrow-key navigation while the dialog is open
document.addEventListener("keydown", e => {
  if (!modal.open) return
  if (e.key === "ArrowRight") { e.preventDefault(); navigateModal(currentModalIndex + 1) }
  if (e.key === "ArrowLeft")  { e.preventDefault(); navigateModal(currentModalIndex - 1) }
})

// ─── Favourite toggle ────────────────────────────────────────────────────────
favBtn.addEventListener("click", () => {
  if (!currentHerb) return
  toggleFavourite(currentHerb.name)
  updateFavBtn()  // update icon/label immediately
  // Do NOT call render() here — re-sorting the list while the modal is open
  // would change indices and break prev/next navigation.
  // render() is called inside the modal's 'close' event handler instead.
})

// ─── Event delegation: card clicks ───────────────────────────────────────────
list.addEventListener("click", e => {
  const cardEl = e.target.closest("[data-name]")
  if (!cardEl) return
  const herb = allHerbs.find(h => h.name === cardEl.dataset.name)
  if (herb) openModal(herb)
})

// Keyboard support for card "buttons" (Enter / Space)
list.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return
  const cardEl = e.target.closest("[data-name]")
  if (!cardEl) return
  e.preventDefault()
  const herb = allHerbs.find(h => h.name === cardEl.dataset.name)
  if (herb) openModal(herb)
})

// ─── Event: search input ─────────────────────────────────────────────────────
searchInput.addEventListener("input", render)

// ─── Event: filter buttons ───────────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => {
      b.classList.remove("active")
      b.setAttribute("aria-pressed", "false")
    })
    btn.classList.add("active")
    btn.setAttribute("aria-pressed", "true")

    activeFilter = btn.dataset.filter
    render()
  })
})

// ─── Init ────────────────────────────────────────────────────────────────────
async function show() {
  allHerbs = await loadHerbs()
  render()
}

show()
