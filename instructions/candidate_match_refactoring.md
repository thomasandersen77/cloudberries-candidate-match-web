# Refaktoreringsinstruksjoner for Candidate Match Front‑End

## Introduksjon

Dette dokumentet er ment som en omfattende veiledning for hvordan du kan refaktorere frontend‑koden i Candidate Match‑applikasjonen slik at den får et mer profesjonelt uttrykk og følger designspråket til **Cloudberries**. Instruksjonen baserer seg på skjermbilder av dagens Cloudberries‑plattform samt generelle bestepraksiser for moderne webutvikling i React. 

Målet er å gjøre applikasjonen mer konsistent, estetisk tiltalende og brukervennlig, samtidig som designet er responsivt (mobilvennlig) og lett å vedlikeholde. Du finner konkrete forslag til fargepalett, typografi, layoutkomponenter, tabeller, skjemaer, og retningslinjer for React‑komponenter.

## Fargepalett og typografi

**Primærfarge (orange)**  
Cloudberries bruker en sterk oransje farge i logoen og på elementer som knapper, overskrifter og bakgrunner. Basert på skjermbildene anbefales en verdi rundt `#F26A21` (juster ved behov etter logo).  

**Sekundærfarger**  
- **Mørk tekstfarge:** en nær‑svart farge som fungerer godt på lys bakgrunn, f.eks. `#333333`.  
- **Lys bakgrunn:** hvit (`#FFFFFF`) til de fleste flater.  
- **Lys grå bakgrunn:** veldig lys grå, f.eks. `#F7F7F7`, brukes for å skille rader i tabeller eller seksjoner.  
- **Aksentfarger:** grønn for visuelle indikatorer som kvalitet/score (f.eks. `#3AAA35`) og eventuelt rød for feiltilstander (`#E53935`).  

**Typografi**  
- **Fontfamilie:** bruk en moderne sans‑serif som _Inter_, _Roboto_ eller _Open Sans_. Disse gir et rent og profesjonelt utseende.  
- **Overskrifter:** fet skrift (bold) med større skriftstørrelse.  
- **Brødtekst:** normal vekt (regular) med god linjeavstand for lesbarhet.  
- **Linker og knapper:** bruk primærfargen og legg til hover‑effekt (lysere/dypere nyanse).  

Definer gjerne fargene som CSS‑variabler i rot‑elementet slik at de enkelt kan gjenbrukes:

```css
:root {
  --color-primary: #F26A21;
  --color-text: #333333;
  --color-bg: #FFFFFF;
  --color-bg-light: #F7F7F7;
  --color-accent-green: #3AAA35;
  --color-accent-red: #E53935;
  --font-family-base: 'Inter', 'Roboto', 'Open Sans', sans-serif;
}
```

## Layout og grunnstruktur

Applikasjonen bør ha en klar og konsekvent struktur:

- **Header:** øverst på siden med logo (Cloudberries‑logoen) til venstre og navigasjonselementer til høyre. Bruk et hvitt eller veldig lyst bakgrunnsfelt for header.  
- **Hovedinnhold:** en container med hvit eller lys grå bakgrunn. Bruk `max-width` for å begrense bredden og `margin: 0 auto` for å sentrere innholdet på store skjermer.  
- **Footer:** enkelt design med liten skriftstørrelse og nøytral bakgrunn (f.eks. grått).  

Bruk Flexbox eller CSS Grid for strukturering av innhold. Eksempel på en grunnleggende layout med React‑komponenter:

```jsx
// Layout.jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => (
  <div className="app-container">
    <Header />
    <main className="main-content">{children}</main>
    <Footer />
  </div>
);

export default Layout;
```

Og tilhørende CSS:

```css
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: var(--font-family-base);
  background-color: var(--color-bg);
  color: var(--color-text);
}

.main-content {
  flex: 1;
  padding: 1rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}
```

### Responsiv design

For å gjøre siden mobilvennlig bør du definere brekkpunkter med media queries. Eksempel:

```css
@media (max-width: 768px) {
  .main-content {
    padding: 0.5rem 1rem;
  }

  .table-container {
    overflow-x: auto;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
```

Dette sikrer at innholdet skaleres pent på små skjermer ved å redusere padding og justere grid‑oppsett. Bruk horisontal scrolling på tabeller dersom de blir for brede på små enheter.

## React‑komponenter

### Header

- Inneholder Cloudberries‑logoen (øverst til venstre) og navigasjonslenker (f.eks. Hjem, Tjenester, Om oss, Team, Blogg, Karriere, Kontakt).  
- Navigasjonen kan implementeres med en horisontal `<nav>` som blir til en hamburger‑meny på mobil.  

```jsx
// Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/cloudberries-logo.svg';

const Header = () => (
  <header className="header">
    <div className="header-inner">
      <Link to="/" className="logo-link">
        <img src={Logo} alt="Cloudberries logo" className="logo" />
      </Link>
      <nav className="nav-links">
        <Link to="/services">Tjenester</Link>
        <Link to="/about">Om oss</Link>
        <Link to="/team">Vårt team</Link>
        <Link to="/blog">Blogg</Link>
        <Link to="/careers">Karriere</Link>
        <Link to="/contact">Kontakt</Link>
      </nav>
    </div>
  </header>
);

export default Header;
```

```css
.header {
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-bg-light);
  padding: 0.5rem 2rem;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
}

.logo {
  height: 40px;
}

.nav-links a {
  margin-left: 1rem;
  text-decoration: none;
  color: var(--color-text);
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-links a:hover {
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .nav-links {
    display: none; /* erstatt med hamburgermeny for mobil */
  }
}
```

### Kort (cards) / seksjonsbokser

I Cloudberries‑nettsiden brukes fargede seksjoner for å fremheve engasjement, innovasjon og team. I Candidate Match kan du bruke en generell `Card`‑komponent for elementer som søkeresultat, CV‑oppsummeringer, debug‑detaljer osv.

```jsx
// Card.jsx
const Card = ({ title, children, variant = 'default' }) => {
  return (
    <div className={`card card--${variant}`}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">{children}</div>
    </div>
  );
};
export default Card;
```

```css
.card {
  background-color: var(--color-bg);
  border: 1px solid var(--color-bg-light);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card--primary {
  background-color: var(--color-primary);
  color: var(--color-bg);
}

.card-title {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}
```

### Tabeller

Tabeller er sentrale i Candidate Match. De bør være lettleste og profesjonelle. Følg disse prinsippene:

- **Full bredde med ordentlig spacing**: bruk `width: 100%`, `border-collapse: collapse` og generøse `padding`.  
- **Zebra‑striping**: alterner bakgrunnsfarge for hver rad (hvit og veldig lys grå) for å forbedre lesbarheten.  
- **Header‑rad**: utheves med fet tekst og eventuelt primærfargen som bakgrunn hvis du ønsker et mer markant uttrykk; alternativt en lys bakgrunn med mørk tekst.  
- **Responsivitet**: på små skjermer kan tabellen konverteres til en vertikal liste eller få horisontal scroll.  

```jsx
// Table.jsx
const Table = ({ columns, data }) => (
  <div className="table-container">
    <table className="styled-table">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.accessor}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map(col => (
              <td key={col.accessor}>{row[col.accessor]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
export default Table;
```

```css
.table-container {
  overflow-x: auto;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.styled-table thead {
  background-color: var(--color-primary);
  color: var(--color-bg);
}

.styled-table th,
.styled-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-bg-light);
}

.styled-table tbody tr:nth-child(odd) {
  background-color: var(--color-bg);
}

.styled-table tbody tr:nth-child(even) {
  background-color: var(--color-bg-light);
}

.styled-table tbody tr:hover {
  background-color: #f1f1f1;
}
```

For tabeller som viser CV‑score eller andre numeriske verdier kan du bruke fargede badges i en egen kolonne. Eksempel:

```jsx
const ScoreBadge = ({ score }) => {
  const color = score >= 80 ? 'var(--color-accent-green)' : score >= 50 ? 'var(--color-primary)' : 'var(--color-accent-red)';
  return (
    <span className="score-badge" style={{ backgroundColor: color }}>
      {score}%
    </span>
  );
};
```

```css
.score-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: var(--color-bg);
  font-weight: 600;
  font-size: 0.8rem;
}
```

### Skjemaer

Skjemaer må være lett å bruke og tydelige:

- **Input‑felt:** ha avrundede hjørner, lys bakgrunn og subtile border. Ved fokus bør border‑fargen endres til primærfargen.  
- **Etiketter:** plasser over hvert felt med middels skriftstørrelse.  
- **Feilmeldinger:** vises med rød aksentfarge under feltet.  
- **Knapper:** bruk `var(--color-primary)` som bakgrunn med hvit tekst og små avrundede hjørner. Legg til hover‑effekt (mørkere/lysere nyanse) og disabled‑tilstand (grått).  

```jsx
// FormField.jsx
const FormField = ({ label, error, children }) => (
  <div className="form-field">
    {label && <label className="form-label">{label}</label>}
    {children}
    {error && <p className="form-error">{error}</p>}
  </div>
);
export default FormField;
```

```css
.form-field {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 0.25rem;
  font-weight: 500;
}

input[type="text"],
input[type="number"],
select,
textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-bg-light);
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(242, 106, 33, 0.2);
}

.form-error {
  color: var(--color-accent-red);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.button {
  background-color: var(--color-primary);
  color: var(--color-bg);
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button:hover {
  background-color: #d95c1d;
}

.button:disabled {
  background-color: var(--color-bg-light);
  color: var(--color-text);
  cursor: not-allowed;
}
```

### Chat‑ og analyseringskomponenter

På skjermbildene ser vi en chat‑lignende modul for AI‑Søk/Analyse. For å implementere dette i React:

- **ChatHistory:** en container som viser brukerspørsmål og svar fra systemet. Gi tydelig fargeforskjell mellom bruker‑meldinger (oransje bakgrunn, hvit tekst) og system‑meldinger (lys grå bakgrunn, mørk tekst).  
- **Input‑felt:** plasser et tekstområde nederst med sendeknapp.  
- **Tilbakemelding:** vis spinner/lastestatus når AI‑respons genereres.  
- **Debug‑detaljer:** plasseres i en egen kollapsbar seksjon under chatten med en enkel liste eller tabell.  

Denne typen modul kan implementeres som egen komponent (`ChatPanel`) som bruker `Card`‑komponenten for innpakning og gjenbrukbare `Message`‑komponenter med props som `sender` og `content`.

## Mobilvennlighet og tilgjengelighet

1. **Responsiv navigasjon:** erstatt horisontal meny med hamburger‑ikon på små skjermer; åpne en sidemeny når brukeren trykker på den.  
2. **Flytende layout:** bruk prosent‑bredder eller `flex`/`grid` for å unngå faste px‑verdier.  
3. **Interaktive elementer:** sørg for tilstrekkelig størrelse på knapper og lenker (min. 44 px høye).  
4. **Lesbarhet:** juster tekststørrelser og marginer med media queries; unngå for små fonter.  
5. **Kontrast:** sørg for tilstrekkelig kontrast mellom tekst og bakgrunn (WCAG AA‑krav) ved hjelp av definert fargepalett.  
6. **Tilgjengelighetsattributter:** bruk `aria-label`, `aria-describedby` og `aria-labelledby` for skjemaelementer og interaktive komponenter.

## Oppsummering

Ved å implementere fargepaletten og typografien til Cloudberries samt strukturere applikasjonen med ryddige React‑komponenter, vil Candidate Match få et mer profesjonelt, konsistent og moderne uttrykk. 

- Definer farger som CSS‑variabler for enkel gjenbruk.  
- Lag gjenbrukbare komponenter (`Header`, `Footer`, `Card`, `Table`, `FormField`, `ChatPanel`) som håndterer layout og stil.  
- Bruk zebra‑striping og tydelig header‑rad i tabeller.  
- Utform skjemaer med god margin, tydelige etiketter og fokus‑effekter.  
- Husk responsiv design: definér brekkpunkter for å tilpasse innhold til små skjermer.  

Med disse retningslinjene kan du starte en omfattende refaktorering av frontend‑koden i Candidate Match og sikre at appen samsvarer med Cloudberries‑estetikken og fungerer godt på både desktop og mobil.
