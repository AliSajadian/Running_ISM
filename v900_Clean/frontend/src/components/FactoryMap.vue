<script>
export default {
  name: 'FactoryMap',
  data() {
    return {
      loading: true,
      error: null,
    }
  },
  mounted() {
    console.log('FactoryMap component mounted successfully!')
    this.loading = false
  },
  beforeUnmount() {
    console.log('FactoryMap component unmounting')
  },
  methods: {
    handleRefresh() {
      console.log('Manual refresh clicked')
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 500)
    },
  },
}
</script>

<template>
  <div class="factory-map-container">
    <!-- Error Display -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>در حال بارگذاری نقشه...</p>
    </div>

    <!-- Main SVG Map Container -->
    <div class="svg-container">
      <svg 
        viewBox="0 0 1700 1000" 
        preserveAspectRatio="xMidYMid meet"
        class="factory-svg"
      >
        <!-- Background -->
        <rect x="0" y="0" width="1700" height="1000" fill="#ffffff" />
        
        <!-- Factory outer boundary (bottom moved up 42px: 825-42=783) -->
        <rect x="40" y="10" width="1340" height="773" fill="none" stroke="#000" stroke-width="3" />
        
        <!-- Street area (moved up 42px, sticks to factory bottom) -->
        <rect x="0" y="783" width="1700" height="60" fill="#999" stroke="#666" stroke-width="2" />
        <text x="850" y="818" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">STREET</text>
        
        <!-- Anbar Salon Tolid (moved up 10px) -->
        <g class="anbar-salon-tolid">
          <rect x="40" y="10" width="200" height="455" fill="none" stroke="#000" stroke-width="2" />
          <text x="140" y="455" text-anchor="middle" font-size="13" font-weight="bold">Anbar Salon Tolid</text>
          
          <!-- PM3 Area (increased width, equal gaps on sides and between) -->
          <rect x="50" y="15" width="63" height="230" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="55" y="20" width="53" height="53" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="55" y="187" width="53" height="53" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="81" y="140" text-anchor="middle" font-size="12" font-weight="bold">PM3</text>
          
          <!-- PM2 Area (30% narrower: 63 * 0.7 = 44) -->
          <rect x="137" y="15" width="44" height="140" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="141" y="20" width="36" height="36" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="141" y="109" width="36" height="36" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="159" y="90" text-anchor="middle" font-size="12" font-weight="bold">PM2</text>
          
          <!-- Cylinders in Anbar Salon Tolid (2 rows, 3 cylinders, moved up with gap above text, all surfaces white) -->
          <!-- Row 1 -->
          <ellipse cx="70" cy="320" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="50" y="320" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="70" cy="365" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="120" cy="320" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="100" y="320" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="120" cy="365" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="170" cy="320" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="150" y="320" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="170" cy="365" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <!-- Row 2 -->
          <ellipse cx="70" cy="380" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="50" y="380" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="70" cy="425" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="120" cy="380" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="100" y="380" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="120" cy="425" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="170" cy="380" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="150" y="380" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="170" cy="425" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
        </g>

        <!-- Empty rect between Anbar Salon Tolid and upper right narrow green oval (moved up 10px) -->
        <rect x="240" y="10" width="660" height="59" fill="none" stroke="#000" stroke-width="2" />

        <!-- Anbar Parvandeh (moved up 10px) -->
        <g class="anbar-parvandeh">
          <rect x="240" y="69" width="190" height="50" fill="none" stroke="#000" stroke-width="2" />
          <text x="335" y="98" text-anchor="middle" font-size="11" font-weight="bold">Anbar Parvandeh</text>
        </g>

        <!-- Anbar Koochak (moved up 10px) -->
        <g class="anbar-koochak">
          <rect x="240" y="119" width="190" height="102" fill="none" stroke="#000" stroke-width="2" />
          <text x="335" y="210" text-anchor="middle" font-size="11" font-weight="bold">Anbar Koochak</text>
          
          <!-- Pallet A 22 cube -->
          <g transform="translate(305, 135)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">A</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">22</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>

        <!-- Anbar Khamir Ghadim (moved up 10px) -->
        <g class="anbar-khamir-ghadim">
          <rect x="710" y="69" width="190" height="154" fill="none" stroke="#000" stroke-width="2" />
          <text x="805" y="210" text-anchor="middle" font-size="11" font-weight="bold">Anbar Khamir Ghadim</text>
          
          <!-- Pallet B 12 cube -->
          <g transform="translate(725, 85)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- Pallet C 17 cube -->
          <g transform="translate(810, 85)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">C</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">17</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>


        <!-- Weight Station 1 (Moved down by its height: 340 + 180 = 520) -->
        <g class="weight-station-1">
          <rect x="290" y="520" width="60" height="180" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="320" y="595" text-anchor="middle" font-size="11" font-weight="bold">Weight</text>
          <text x="320" y="615" text-anchor="middle" font-size="11" font-weight="bold">Station</text>
          <text x="320" y="635" text-anchor="middle" font-size="11" font-weight="bold">1</text>
        </g>

        <!-- Anbar Sangin (moved left with gap from right narrow green oval) -->
        <g class="anbar-sangin">
          <rect x="790" y="345" width="110" height="160" fill="none" stroke="#000" stroke-width="2" />
          <text x="845" y="490" text-anchor="middle" font-size="13" font-weight="bold">Anbar Sangin</text>
          
          <!-- PM2 Cylinders in Sangin (2 rows, 2 cylinders each, with data labels) -->
          <!-- Row 1 Left: PM2, 140, 12 -->
          <ellipse cx="820" cy="360" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="800" y="360" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="820" cy="405" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="820" y="378" text-anchor="middle" font-size="7">PM2</text>
          <text x="820" y="388" text-anchor="middle" font-size="7">140</text>
          <text x="820" y="398" text-anchor="middle" font-size="7">12</text>
          
          <!-- Row 1 Right: PM2, 140, 13 -->
          <ellipse cx="860" cy="360" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="840" y="360" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="860" cy="405" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="860" y="378" text-anchor="middle" font-size="7">PM2</text>
          <text x="860" y="388" text-anchor="middle" font-size="7">140</text>
          <text x="860" y="398" text-anchor="middle" font-size="7">13</text>
          
          <!-- Row 2 Left: PM2, 130, 22 -->
          <ellipse cx="820" cy="420" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="800" y="420" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="820" cy="465" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="820" y="438" text-anchor="middle" font-size="7">PM2</text>
          <text x="820" y="448" text-anchor="middle" font-size="7">130</text>
          <text x="820" y="458" text-anchor="middle" font-size="7">22</text>
          
          <!-- Row 2 Right: PM2, 120, 13 -->
          <ellipse cx="860" cy="420" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="840" y="420" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="860" cy="465" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="860" y="438" text-anchor="middle" font-size="7">PM2</text>
          <text x="860" y="448" text-anchor="middle" font-size="7">120</text>
          <text x="860" y="458" text-anchor="middle" font-size="7">13</text>
        </g>

        <!-- QC Area (moved left with gap from right narrow green oval) -->
        <g class="qc-area">
          <rect x="790" y="525" width="110" height="110" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="845" y="585" text-anchor="middle" font-size="13" font-weight="bold">QC</text>
        </g>

        <!-- Narrow Green Ovals (Roads) - Narrower, half height from top -->
        <g class="roads">
          <!-- First vertical divider (left, narrower, moved down a bit) -->
          <ellipse cx="480" cy="520" rx="8" ry="175" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
          <!-- Second vertical divider (right-center, narrower, moved down a bit) -->
          <ellipse cx="950" cy="520" rx="8" ry="175" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
          <!-- Third divider (right upper, height increased by 1/3: 87.5 * 1.333 = 116.7, extended from bottom) -->
          <ellipse cx="950" cy="136.7" rx="8" ry="116.7" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
        </g>

        <!-- Akhal 2 33 cube (height doubled: 20→40) -->
        <g transform="translate(1040, 40)">
          <!-- Front face (height doubled) -->
          <path d="M 0,15 L 80,15 L 80,55 L 0,55 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
          <text x="40" y="38" text-anchor="middle" font-size="9" font-weight="bold">Akhal 2 33</text>
          <!-- Top face (parallelogram) -->
          <path d="M 0,15 L 20,5 L 100,5 L 80,15 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
          <!-- Right side face (height doubled) -->
          <path d="M 80,15 L 100,5 L 100,45 L 80,55 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
        </g>

        <!-- Right Side: Anbar Khamir Kordan Container (moved up to stick to factory top at y=10) -->
        <g class="right-container">
          <!-- Anbar Khamir KORDAN rect (top sticks to factory at y=10) -->
          <rect x="1170" y="10" width="210" height="650" fill="none" stroke="#000" stroke-width="2" />
          
          <!-- Oval inside (moved up 10px) -->
          <ellipse cx="1260" cy="130" rx="60" ry="95" fill="none" stroke="#000" stroke-width="2" />
          <text x="1260" y="120" text-anchor="middle" font-size="12" font-weight="bold">Anbar</text>
          <text x="1260" y="138" text-anchor="middle" font-size="12" font-weight="bold">Khamir</text>
          <text x="1260" y="156" text-anchor="middle" font-size="12" font-weight="bold">KORDAN</text>
          
          <!-- Akhal 1 100 cube (height doubled: 20→40) -->
          <g transform="translate(1220, 40)">
            <!-- Front face (height doubled) -->
            <path d="M 0,15 L 80,15 L 80,55 L 0,55 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="40" y="38" text-anchor="middle" font-size="9" font-weight="bold">Akhal 1 100</text>
            <!-- Top face (parallelogram) -->
            <path d="M 0,15 L 20,5 L 100,5 L 80,15 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face (height doubled) -->
            <path d="M 80,15 L 100,5 L 100,45 L 80,55 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- PM4 Area (moved up 10px) -->
          <rect x="1290" y="237" width="65" height="274" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="1295" y="242" width="55" height="55" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="1295" y="451" width="55" height="55" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="1322" y="374" text-anchor="middle" font-size="12" font-weight="bold">PM4</text>
        </g>

        <!-- Office (increased 20%: 108×108, moved up with gap below Kordan) -->
        <g class="office">
          <rect x="1170" y="670" width="108" height="108" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1224" y="729" text-anchor="middle" font-size="12" font-weight="bold">Office</text>
        </g>

        <!-- Weight Station 2 (narrower, taller, moved down, stick to Kordan at x=1170) -->
        <g class="weight-station-2">
          <rect x="1110" y="320" width="60" height="180" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1140" y="395" text-anchor="middle" font-size="11" font-weight="bold">Weight</text>
          <text x="1140" y="415" text-anchor="middle" font-size="11" font-weight="bold">Station</text>
          <text x="1140" y="435" text-anchor="middle" font-size="11" font-weight="bold">2</text>
        </g>

        <!-- Anbar PAK (bottom edge aligns with factory bottom at y=783) -->
        <g class="anbar-pak">
          <!-- PAK narrow rect (bottom at y=783, aligned with factory) -->
          <rect x="1380" y="460" width="60" height="323" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <text x="1410" y="620" text-anchor="middle" font-size="12" font-weight="bold" transform="rotate(90 1410 620)">Anbar PAK</text>
          
          <!-- Akhal 4 98 cube (height doubled: 16→32) -->
          <g transform="translate(1375, 480)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 4 98</text>
            <!-- Top face (parallelogram) -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face (height doubled) -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>

        <!-- Entrances (moved up 42px: 790-42=748) -->
        <g class="entrances">
          <rect x="420" y="748" width="120" height="70" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="480" y="788" text-anchor="middle" font-size="12">Entrance</text>
          
          <!-- Right entrance -->
          <rect x="950" y="748" width="120" height="70" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1010" y="788" text-anchor="middle" font-size="12">Entrance</text>
        </g>

        <!-- Loading/Unloading Forklift Icon (pink) -->
        <g class="forklift-loading">
          <path d="M 500 590 L 520 590 L 520 610 L 500 610 Z" fill="#ffcccc" stroke="#cc0000" stroke-width="2" />
          <rect x="515" y="595" width="8" height="10" fill="#cc0000" />
          <text x="510" y="630" text-anchor="middle" font-size="9">Loading/</text>
          <text x="510" y="642" text-anchor="middle" font-size="9">Unloading</text>
        </g>

        <!-- Ready Forklift Icon (green) -->
        <g class="forklift-ready">
          <path d="M 280 410 L 300 410 L 300 430 L 280 430 Z" fill="#ccffcc" stroke="#00cc00" stroke-width="2" />
          <rect x="295" y="415" width="8" height="10" fill="#00cc00" />
          <text x="290" y="448" text-anchor="middle" font-size="9">Ready</text>
        </g>

        <!-- Anbar Akhal (moved up 42px, height 5x: 25*5=125) -->
        <g class="anbar-akhal-bottom">
          <rect x="40" y="843" width="320" height="125" fill="none" stroke="#000" stroke-width="2" />
          <text x="200" y="860" text-anchor="middle" font-size="12" font-weight="bold">Anbar Akhal</text>
          
          <!-- Akhal 3 114 cube -->
          <g transform="translate(50, 875)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 3 114</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- Akhal 4 260 cube -->
          <g transform="translate(135, 875)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 4 260</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- Akhal 2 170 cube -->
          <g transform="translate(220, 875)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 2 170</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>

        <!-- Incoming/Outgoing Truck Icons (moved up 42px: 827-42=785) -->
        <g class="truck-icons">
          <!-- Incoming truck (green) - reversed direction, outside factory -->
          <g transform="translate(292, 785) scale(-1, 1)">
            <!-- Truck cabin (taller, wider) -->
            <rect x="0" y="5" width="32" height="30" fill="#90ee90" stroke="#228b22" stroke-width="2" rx="2" />
            <!-- Truck cargo/trailer area (much longer and wider) -->
            <rect x="32" y="0" width="90" height="40" fill="#c8e6c9" stroke="#228b22" stroke-width="2" rx="2" />
            <!-- Cabin details -->
            <rect x="4" y="10" width="24" height="15" fill="#e0f7fa" stroke="#228b22" stroke-width="1" />
            <!-- Wheels (bigger) -->
            <circle cx="15" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <circle cx="50" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <circle cx="105" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <!-- Cargo separator line -->
            <line x1="32" y1="5" x2="32" y2="35" stroke="#228b22" stroke-width="1" />
            <text x="60" y="60" text-anchor="middle" font-size="10" font-weight="bold" transform="scale(-1, 1)" dx="-120">Incoming</text>
          </g>
          
          <!-- Outgoing truck 1 (blue) - moved up 42px -->
          <g transform="translate(590, 785)">
            <!-- Truck cabin -->
            <rect x="0" y="5" width="32" height="30" fill="#90caf9" stroke="#1976d2" stroke-width="2" rx="2" />
            <!-- Truck cargo/trailer area -->
            <rect x="32" y="0" width="90" height="40" fill="#bbdefb" stroke="#1976d2" stroke-width="2" rx="2" />
            <!-- Cabin details -->
            <rect x="4" y="10" width="24" height="15" fill="#e1f5fe" stroke="#1976d2" stroke-width="1" />
            <!-- Wheels -->
            <circle cx="15" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <circle cx="50" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <circle cx="105" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <!-- Cargo separator line -->
            <line x1="32" y1="5" x2="32" y2="35" stroke="#1976d2" stroke-width="1" />
            <text x="60" y="60" text-anchor="middle" font-size="10" font-weight="bold">Outgoing</text>
          </g>
          
          <!-- Outgoing truck 2 (blue) - moved up 42px -->
          <g transform="translate(740, 785)">
            <!-- Truck cabin -->
            <rect x="0" y="5" width="32" height="30" fill="#90caf9" stroke="#1976d2" stroke-width="2" rx="2" />
            <!-- Truck cargo/trailer area -->
            <rect x="32" y="0" width="90" height="40" fill="#bbdefb" stroke="#1976d2" stroke-width="2" rx="2" />
            <!-- Cabin details -->
            <rect x="4" y="10" width="24" height="15" fill="#e1f5fe" stroke="#1976d2" stroke-width="1" />
            <!-- Wheels -->
            <circle cx="15" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <circle cx="50" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <circle cx="105" cy="42" r="6" fill="#333" stroke="#000" stroke-width="1.5" />
            <!-- Cargo separator line -->
            <line x1="32" y1="5" x2="32" y2="35" stroke="#1976d2" stroke-width="1" />
          </g>
        </g>
      </svg>
    </div>

    <!-- Right Sidebar with Title, Buttons, and Footer -->
    <div class="right-sidebar">
      <div class="sidebar-top">
        <h1 class="map-title">نقشه کارخانه<br/>Factory Map</h1>
        
        <button 
          class="refresh-button"
          @click="handleRefresh"
          :disabled="loading"
        >
          <span v-if="loading">در حال بارگذاری...</span>
          <span v-else">بروزرسانی ↻</span>
        </button>
        
        <router-link
          to="/myapp/"
          class="back-button"
        >
          → بازگشت به صفحه اصلی
        </router-link>
      </div>
      
      <div class="sidebar-footer">
        <p>Factory Map</p>
        <p>7 Warehouses</p>
        <p>2 Weight Stations</p>
        <p>Entrance/Exit</p>
        <p>Loading Zone</p>
        <p>Office/QC</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.factory-map-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  direction: rtl;
  overflow: hidden;
}

.right-sidebar {
  width: 250px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.sidebar-top {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 11px;
  font-family: monospace;
  line-height: 1.8;
}

.sidebar-footer p {
  margin: 4px 0;
}

.map-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  font-family: Tahoma, Arial, sans-serif;
  text-align: center;
  line-height: 1.4;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.refresh-button,
.back-button {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: Tahoma, Arial, sans-serif;
  text-decoration: none;
  display: block;
  text-align: center;
  width: 100%;
}

.refresh-button:hover:not(:disabled),
.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.02);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  background: #fee;
  color: #c33;
  padding: 12px 30px;
  text-align: center;
  font-weight: 600;
  border-bottom: 2px solid #c33;
  flex-shrink: 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 20px;
  font-size: 16px;
  color: #666;
  font-family: Tahoma, Arial, sans-serif;
}

.svg-container {
  flex: 1;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fafafa;
  overflow: hidden;
}

.factory-svg {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: 100%;
  background: white;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .right-sidebar {
    width: 150px;
  }
  
  .sidebar-top {
    padding: 15px 10px;
    gap: 10px;
  }
  
  .sidebar-footer {
    padding: 15px 10px;
    font-size: 10px;
  }
  
  .map-title {
    font-size: 14px;
  }
  
  .refresh-button,
  .back-button {
    padding: 8px 12px;
    font-size: 11px;
  }
}
</style>

