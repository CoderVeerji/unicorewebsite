/**
 * Side-view sport motorcycle as an SVG string, facing right, drawn in the
 * KICK-4T pack colours (black bodywork, gold lines, frame and wheels).
 * Proportions follow a real sportbike: wheel diameter ~74, wheelbase ~2.6
 * wheel diameters, small raised tail, tank over a visible engine, fairing
 * only at the front.
 *
 * The scene's script flips it (scaleX(-1)) when the visitor scrolls back up,
 * so it always rides forward, and turns the wheels with scroll.
 */
const R = 30;
const RX = 66;
const FX = 262;
const CY = 152;

function wheel(cx, front, id) {
  const spokes = Array.from({ length: 6 }, (_, i) => i * 60)
    .map((a) => `<path d="M0 0 L0 -${R - 3}" stroke="#E8B04A" stroke-width="4.2" stroke-linecap="round" transform="rotate(${a})"/>`).join('');
  const slots = Array.from({ length: 24 }, (_, i) => i * 15)
    .map((a) => `<circle cx="0" cy="-20" r=".9" fill="#101012" transform="rotate(${a})"/>`).join('');
  return `
  <g transform="translate(${cx} ${CY})">
    <circle r="${R + 7}" fill="#09090b"/>
    <circle r="${R + 7}" fill="none" stroke="#202026" stroke-width="2"/>
    <circle r="${R + 7}" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2 3" opacity=".5"/>
    <circle r="${R + 1}" fill="#15151a" stroke="url(#kb-gold${id})" stroke-width="3.2"/>
    ${front ? `<circle r="22" fill="none" stroke="#cfd3d9" stroke-width="2" opacity=".9"/>${slots}` : `<circle r="17" fill="none" stroke="#9aa0a8" stroke-width="1.3" opacity=".7"/>`}
    <g class="k4-wheel" data-k4-wheel>${spokes}<circle r="6" fill="url(#kb-gold${id})"/><circle r="2.3" fill="#15151a"/></g>
    ${front ? `<path d="M-6 -27 L8 -29 L10 -21 L-4 -19 Z" fill="#E8B04A" transform="rotate(-34)"/>` : ''}
  </g>`;
}

export function bikeSvg(id = '') {
  return `<svg class="k4-bike-svg" viewBox="0 0 330 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="kb-body${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d3d46"/><stop offset=".3" stop-color="#18181d"/><stop offset="1" stop-color="#050506"/></linearGradient>
    <linearGradient id="kb-gold${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".5" stop-color="#E8B04A"/><stop offset="1" stop-color="#B8741A"/></linearGradient>
    <linearGradient id="kb-steel${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceff2"/><stop offset="1" stop-color="#6d737d"/></linearGradient>
    <linearGradient id="kb-eng${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3d45"/><stop offset="1" stop-color="#14151a"/></linearGradient>
    <radialGradient id="kb-lamp${id}" cx=".2" cy=".5" r=".9"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#FFE9A8"/><stop offset="1" stop-color="#F2C86B" stop-opacity=".1"/></radialGradient>
  </defs>

  <!-- exhaust and swingarm, behind everything -->
  <path d="M172 148 C146 152 100 142 44 126" stroke="url(#kb-steel${id})" stroke-width="8" stroke-linecap="round"/>
  <path d="M44 126 L22 120" stroke="#2f3238" stroke-width="11" stroke-linecap="round"/>
  <path d="M${RX} ${CY} L126 134" stroke="#17171b" stroke-width="9" stroke-linecap="round"/>
  <path d="M${RX} ${CY} L126 134" stroke="#E8B04A" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>

  ${wheel(RX, false, id)}

  <!-- engine, between the frame and the belly pan -->
  <path d="M146 112 C160 106 204 104 218 112 L222 148 C200 154 170 154 150 146 Z" fill="url(#kb-eng${id})" stroke="#4a4f59" stroke-width="1.2"/>
  <path d="M158 142 L156 118 M172 144 L171 115 M186 144 L186 113 M200 143 L201 113 M212 142 L214 114" stroke="#666c78" stroke-width="2"/>
  <circle cx="188" cy="130" r="10" fill="#23262c" stroke="url(#kb-gold${id})" stroke-width="2.2"/>
  <circle cx="188" cy="130" r="3.6" fill="#E8B04A"/>

  <!-- one flowing body: tail, seat, tank, fairing -->
  <path d="M12 94 C30 84 52 80 70 82 C84 84 92 92 110 92 C122 91 128 82 140 78 C156 72 176 72 196 76 L214 78 L238 50 C242 46 247 48 249 53 L256 70 C272 78 290 92 296 100 C298 106 292 110 284 112 L250 118 C236 121 222 128 212 140 C196 124 170 114 146 112 C128 110 118 120 104 122 C80 116 52 110 28 106 C16 104 10 98 12 94 Z" fill="url(#kb-body${id})"/>
  <!-- seat -->
  <path d="M66 86 C80 88 90 94 108 94 C120 94 126 90 130 86 C120 90 106 91 94 88 C84 86 76 84 66 86 Z" fill="#08080a" stroke="#E8B04A" stroke-opacity=".4" stroke-width=".9"/>
  <rect x="11" y="91" width="11" height="4.2" rx="2" fill="#e21418" transform="rotate(-18 16 93)"/>
  <!-- tank shine, gold lines -->
  <path d="M146 77 C162 72 180 72 198 76" stroke="#fff" stroke-opacity=".42" stroke-width="2" stroke-linecap="round"/>
  <path d="M26 101 C88 108 150 94 214 88 C250 84 274 92 292 101" stroke="url(#kb-gold${id})" stroke-width="3" stroke-linecap="round"/>
  <path d="M120 100 C150 90 176 82 210 82 C226 82 240 86 252 96" stroke="url(#kb-gold${id})" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
  <path d="M216 80 C228 84 236 94 238 108" stroke="url(#kb-gold${id})" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  <!-- windscreen and lamp -->
  <path d="M214 78 L238 52 C243 48 247 50 249 55 L254 68 C240 64 226 68 214 78 Z" fill="#a9bdd0" fill-opacity=".5" stroke="#dbe3ec" stroke-opacity=".6" stroke-width="1"/>
  <path d="M278 82 C288 86 296 92 298 98 L284 97 Z" fill="url(#kb-lamp${id})"/>
  <!-- belly pan -->
  <path d="M290 106 L250 118 C236 121 222 130 212 148 L236 150 C262 140 282 124 290 106 Z" fill="url(#kb-body${id})"/>
  <path d="M244 128 C262 124 280 116 290 106" stroke="url(#kb-gold${id})" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>

  <!-- fork, fender, bars, mirror -->
  <path d="M240 64 L${FX} ${CY}" stroke="#15151a" stroke-width="7.5" stroke-linecap="round"/>
  <path d="M244 82 L${FX - 4} ${CY - 6}" stroke="url(#kb-gold${id})" stroke-width="4" stroke-linecap="round"/>
  <path d="M234 122 C250 108 280 108 292 124" stroke="url(#kb-gold${id})" stroke-width="5" stroke-linecap="round"/>
  <path d="M236 58 L224 53 L214 55" stroke="#101013" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M226 46 L217 43 L214 47 L221 50 Z" fill="#101013" stroke="#E8B04A" stroke-opacity=".6" stroke-width="1"/>

  ${wheel(FX, true, id)}
</svg>`;
}
