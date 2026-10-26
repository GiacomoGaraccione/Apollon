import { DeepPartial } from 'redux';
import { ColorLegendElementType } from '.';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementType } from '../../uml-element-type';
import { Text } from '../../../utils/svg/text';

// Deve combaciare con lineHeight/fontWeight usati da <Multiline> in color-legend-component.tsx -
// altrimenti il numero di righe calcolato qui per dimensionare l'altezza non corrisponde a quello
// che Multiline disegna davvero (lineHeight di default di Multiline e' 16, non esposto come prop qui).
const LINE_HEIGHT = 16;
const PADDING = 20;

export class ColorLegend extends UMLElement {
  type: UMLElementType = ColorLegendElementType.ColorLegend;

  constructor(values?: DeepPartial<IUMLElement>) {
    super(values && !values.bounds ? { ...values, bounds: { x: 0, y: 0, width: 160, height: 50 } } : values);
  }

  render(canvas: ILayer): ILayoutable[] {
    // La Nota deve andare a capo, non crescere all'infinito in larghezza: a differenza di
    // calculateNameBounds (pensato per etichette corte su una riga, come il nome di una classe),
    // che misura l'intero nome come UNA riga sola e usa quella larghezza come minimo - cosi' il
    // riquadro si allargava sempre esattamente quanto serviva a stare tutto su una riga, e il
    // word-wrap di <Multiline> (che spezza le righe in base alla LARGHEZZA del riquadro) non
    // scattava mai. Qui invece la LARGHEZZA resta quella attuale (default o scelta ridimensionando
    // a mano) e viene calcolato solo quante righe servirebbero per andare a capo il testo a quella
    // larghezza - stesso identico algoritmo greedy di `Multiline.calculateWordsByLines` - cosi' il
    // conteggio corrisponde a cio' che viene davvero disegnato, e l'ALTEZZA si adatta di conseguenza.
    const words = this.name ? this.name.split(/\s+/) : [];
    const spaceWidth = Text.size(canvas, ' ', { fontWeight: 'bold' }).width;
    let lines = 0;
    let currentLineWidth = 0;
    for (const word of words) {
      const wordWidth = Text.size(canvas, word, { fontWeight: 'bold' }).width;
      if (lines > 0 && currentLineWidth + wordWidth + spaceWidth < this.bounds.width) {
        currentLineWidth += wordWidth + spaceWidth;
      } else {
        lines++;
        currentLineWidth = wordWidth;
      }
    }
    const neededHeight = Math.max(1, lines) * LINE_HEIGHT + PADDING;
    this.bounds = { ...this.bounds, height: Math.max(this.bounds.height, neededHeight) };
    return [this];
  }
}
