import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ELEMENTS, ElementData } from '@/data/elements';
import ElementTile, { TILE_GAP, TILE_SIZE } from './ElementTile';

type Props = {
  onSelect: (el: ElementData) => void;
  colorForElement?: (el: ElementData) => string | null;
  dimIf?: (el: ElementData) => boolean;
};

const CELL = TILE_SIZE + TILE_GAP;
const COLS = 18;
const MAIN_ROWS = 7;
const F_BLOCK_OFFSET_ROW = MAIN_ROWS + 1.5;

export default function PeriodicTableGrid({ onSelect, colorForElement, dimIf }: Props) {
  const width = COLS * CELL + 24;
  const height = (MAIN_ROWS + 3.5) * CELL + 24;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.hScroll}>
      <ScrollView showsVerticalScrollIndicator>
        <View style={{ width, height, padding: 12 }}>
          {ELEMENTS.map((el) => {
            const isF = el.category === 'lanthanide' || el.category === 'actinide';
            const row = isF ? F_BLOCK_OFFSET_ROW + (el.category === 'actinide' ? 1 : 0) : el.ypos;
            const col = isF ? (el.number >= 89 ? el.number - 89 : el.number - 57) + 3 : el.xpos;
            return (
              <View
                key={el.number}
                style={{
                  position: 'absolute',
                  left: (col - 1) * CELL,
                  top: (row - 1) * CELL,
                }}
              >
                <ElementTile
                  element={el}
                  onPress={onSelect}
                  highlightColor={colorForElement ? colorForElement(el) : undefined}
                  dimmed={dimIf ? dimIf(el) : false}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hScroll: { flex: 1 },
});