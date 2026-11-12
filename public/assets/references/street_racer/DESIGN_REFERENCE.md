# STREET RACER (HERO MOTORCYCLE) — 3D ASSET DESIGN REFERENCE
## MOTO RUSH 3D: CONVOY MAYHEM

### 1. Concept & Stance
- **Vehicle Type**: High-performance contemporary liter-class supersport motorcycle.
- **Visual Style**: Clean, stylized commercial arcade aesthetic (semi-realistic proportions with bold silhouettes and vibrant PBR materials).
- **Attitude**: Aggressive, forward-biased mass concentration, aerodynamic aerodynamic fairings, track-ready stance.

---

### 2. Physical Dimensions & Geometry Scale (1:1 Three.js World Units)
- **Total Length ($Z$)**: $2.10\text{ m}$
- **Wheelbase**: $1.42\text{ m}$
- **Seat Height ($Y$)**: $0.82\text{ m}$
- **Handlebar / Screen Height ($Y$)**: $1.08\text{ m}$
- **Maximum Width ($X$)**: $0.76\text{ m}$ (across bar ends / mirror winglets)
- **Tire Dimensions**:
  - Front: 120/70-ZR17 (Diameter: $0.62\text{ m}$, Width: $0.12\text{ m}$)
  - Rear: 190/55-ZR17 (Diameter: $0.64\text{ m}$, Width: $0.19\text{ m}$)

---

### 3. Four-View Orthographic & Perspective Specifications

#### A. Front View
- **Nose Cone**: Compact, knife-edge aerodynamic front fairing with central ram-air duct.
- **Optics**: Twin horizontal slit LED daytime running lights with micro-projector low/high beams (emissive white-blue).
- **Windscreen**: Short, bubble-profile tinted polycarbonate windscreen seamlessly integrated into the front cowl.
- **Chassis & Suspension**: Dual $43\text{ mm}$ inverted front fork legs finished in anodized satin gold; perforated stainless steel twin front brake rotors with radial-mount monobloc calipers.

#### B. Side View (Profile)
- **Tank & Ergonomics**: Sculpted $17\text{-liter}$ aerodynamic fuel tank with deep knee recesses for the rider; low-profile racing gas cap.
- **Frame**: Exposed cast aluminum twin-spar perimeter frame with trellis subframe.
- **Fairings**: Aerodynamic side cowls with multi-stage air extraction gills and enclosed lower belly pan terminating before the rear tire.
- **Swingarm & Drive**: Gull-wing aluminum rear swingarm linked to an adjustable piggyback central monoshock.
- **Exhaust**: 4-into-2 header pipes feeding into twin high-mounted under-tail silencers.

#### C. Rear View
- **Tail Cowl**: Tapered single-seat aerodynamic tail section with integrated aerodynamic winglet spoilers.
- **Lighting**: Dual vertical LED light guides flush with the tail edge (emissive crimson red).
- **Tire Stance**: Imposing wide $190\text{ mm}$ rear sport slick tire with deep directional tread grooves.
- **Exhaust Outlets**: Twin carbon-sleeved circular exhaust tips flanking the license/indicator hanger.

#### D. Three-Quarter View (Hero Angle)
- Shows the dynamic diagonal contour line flowing from the front axle, climbing through the fuel tank ridge, and tapering off the elevated rear tail section.
- Balanced color distribution: Crimson red bodywork accented by gunmetal black fairing inserts and raw metallic engine components.

---

### 4. PBR Materials & Color Palette
| Component | Color Hex | Material Type | Roughness | Metalness | Special Properties |
|---|---|---|---|---|---|
| Main Fairings / Tank | `#EF233C` | Polyurethane Gloss Paint | 0.16 | 0.10 | Clearcoat 1.0 |
| Lower Belly / Trim | `#1E1E24` | Satin Composite | 0.45 | 0.20 | Matte texture |
| Twin-Spar Frame | `#8D99AE` | Cast Aluminum | 0.32 | 0.88 | Anodized metallic |
| Inverted Front Forks | `#D4AF37` | Anodized Gold Alloy | 0.22 | 0.92 | High luster |
| Brake Discs | `#D8D8D8` | Drilled Stainless Steel | 0.28 | 0.90 | Perforated disc geometry |
| Tires & Grips | `#18181A` | Vulcanized Rubber | 0.82 | 0.05 | Directional tread depth |
| Front LED Lights | `#E0F7FA` | Emissive Glass | 0.10 | 0.00 | Emissive Intensity $2.5$ |
| Rear Taillights | `#FF0055` | Emissive Polycarbonate | 0.15 | 0.00 | Emissive Intensity $2.0$ |

---

### 5. Meshy Prompt & Configuration Plan

- **Task Type**: `text-to-3d` (or `multi-image-to-3d` with generated reference plates)
- **Model Engine**: `meshy-4` (latest high-fidelity PBR mesh generation engine)
- **Prompt String**:
  > `High-performance modern liter-class supersport motorcycle, stylized arcade aesthetic, crimson red and gunmetal bodywork, anodized gold inverted front forks, perforated disc brakes, twin under-tail exhaust, exposed perimeter frame, aerodynamic front fairing with twin LED headlights, wide rear sport tire, realistic proportions, clean topology, PBR textures, game-ready 3D model, studio lighting, isolated on neutral background`
- **Negative Prompt**:
  > `low-poly, distorted, melted, low-resolution, blurry textures, broken wheels, asymmetrical handlebars, floating parts, toy, miniature, scooter, chopper`
- **Output Target**: GLB format, $< 25,000$ triangles, $2048\times 2048$ PBR texture set (BaseColor, Metallic, Roughness, Normal, Emissive).
