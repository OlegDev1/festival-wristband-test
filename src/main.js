/* Boot. Wires the features together; each feature lives in its own folder and knows nothing about the others.
   Order matters only here:
     1. features register strings and build their DOM (mount)
     2. the language is applied (fills every [data-i], then redraws text built in code)
     3. the timeline starts: on every scroll frame it calls the features below, band last (it needs the active chapter's look)
     4. the band's rendered frames load on their own (src/band). */
import './core/common-strings.js';
import './sections/how.js';
import {startLang} from './core/i18n.js';
import * as timeline from './story/timeline.js';
import * as header from './header/header.js';
import * as hero from './hero/hero.js';
import * as scene from './scene/scene.js';
import * as end from './sections/end.js';
import CHAPTERS from './chapters/index.js';
import * as chapters from './chapters/chapters.js';
import * as captions from './captions/captions.js';
import * as rail from './rail/rail.js';
import * as band from './band/band.js';

header.mount();
scene.mount();
end.mount();
chapters.mount(CHAPTERS,{buzz:band.buzz});
captions.mount(CHAPTERS);
rail.mount(CHAPTERS);
band.mount(CHAPTERS.map(c=>c.pose));

startLang();

timeline.start(CHAPTERS.length,f=>{
  header.update(f);
  hero.update(f);
  scene.update(f);
  const look=chapters.update(f);
  captions.update(f);
  rail.update(f);
  band.update(f,look);
});
