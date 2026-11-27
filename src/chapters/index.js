/* The story's chapters, in order. One chapter = <id>.js (strings, pose, screen, animation) + <id>.css (its screen styles).
   To add one: copy a chapter file pair, give it a new id, add it to this list.
   Scroll length, rail dots and captions follow the list automatically. */
import home from './home.js';
import crew from './crew.js';
import bump from './bump.js';
import radar from './radar.js';
import find from './find.js';
import meet from './meet.js';
import places from './places.js';
import ghost from './ghost.js';
import sos from './sos.js';

export default [home,crew,bump,radar,find,meet,places,ghost,sos];
