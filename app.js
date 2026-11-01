document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);

  let state = {
    adults: 8,
    kids: 2,
    hunger: 'normal',
    mode: 'delivery',
    totalCost: 0,
    paymentHandle: localStorage.getItem('pizzacalc-payment') || ''
  };

  if (state.paymentHandle && $('#venmo-handle')) {
    $('#venmo-handle').value = state.paymentHandle;
  }

  // Steppers
  const bindStepper = (name, key) => {
    const minusBtn = $(`#${name}-minus`);
    const plusBtn = $(`#${name}-plus`);
    if (minusBtn) {
      minusBtn.onclick = () => {
        if (state[key] > 0) {
          state[key]--;
          render();
        }
      };
    }
    if (plusBtn) {
      plusBtn.onclick = () => {
        state[key]++;
        render();
      };
    }
  };

  bindStepper('adults', 'adults');
  bindStepper('kids', 'kids');

  // Hunger Segments
  const hungerEl = $('#hunger');
  if (hungerEl) {
    hungerEl.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        hungerEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        state.hunger = btn.dataset.v;
        render();
      };
    });
  }

  // Mode Segments
  const modeEl = $('#mode');
  if (modeEl) {
    modeEl.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        modeEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        state.mode = btn.dataset.v;
        render();
      };
    });
  }

  // Expenses & Payment
  const totalCostInput = $('#total-cost');
  if (totalCostInput) {
    totalCostInput.oninput = e => {
      state.totalCost = parseFloat(e.target.value) || 0;
      updateCostSplit();
    };
  }

  const handleInput = $('#venmo-handle');
  if (handleInput) {
    handleInput.oninput = e => {
      state.paymentHandle = e.target.value.trim();
      localStorage.setItem('pizzacalc-payment', state.paymentHandle);
    };
  }

  function calculate() {
    // Slices per person based on appetite
    const slicesAdult = state.hunger === 'light' ? 2 : (state.hunger === 'hungry' ? 4.5 : 3);
    const slicesKid = state.hunger === 'light' ? 1.5 : (state.hunger === 'hungry' ? 2.5 : 2);

    const totalSlices = Math.round(state.adults * slicesAdult + state.kids * slicesKid);
    const totalPizzas = Math.max(1, Math.ceil(totalSlices / 8));
    const providedSlices = totalPizzas * 8;
    const bufferSlices = providedSlices - totalSlices;

    const deliveryItems = [];

    // US Topping Recommendation Mix
    if (totalPizzas === 1) {
      deliveryItems.push({ name: 'Pepperoni & Cheese (Half & Half)', qty: '1 Large (14")', sub: '8 slices · Perfect for a small gathering' });
    } else if (totalPizzas === 2) {
      deliveryItems.push({ name: 'Classic Pepperoni', qty: '1 Large (14")', sub: 'America\'s #1 party choice' });
      deliveryItems.push({ name: 'Four Cheese / Margherita', qty: '1 Large (14")', sub: 'Crowd-pleaser for vegetarians & kids' });
    } else if (totalPizzas === 3) {
      deliveryItems.push({ name: 'Classic Pepperoni', qty: '1 Large (14")', sub: 'High demand favorite' });
      deliveryItems.push({ name: 'Plain Mozzarella & Herb', qty: '1 Large (14")', sub: 'Universal safe bet' });
      deliveryItems.push({ name: 'Meat Lovers / Sausage', qty: '1 Large (14")', sub: 'Sausage, bacon, or bell peppers' });
    } else if (totalPizzas === 4) {
      deliveryItems.push({ name: 'Classic Pepperoni', qty: '2 Large (14")', sub: '16 slices · Highest volume' });
      deliveryItems.push({ name: 'Four Cheese', qty: '1 Large (14")', sub: '8 slices · Vegetarian safe' });
      deliveryItems.push({ name: 'BBQ Chicken or Veggie Supreme', qty: '1 Large (14")', sub: '8 slices · Specialty flavor' });
    } else {
      const pepCount = Math.ceil(totalPizzas * 0.40);
      const cheeseCount = Math.max(1, Math.round(totalPizzas * 0.30));
      const meatCount = Math.max(1, Math.round(totalPizzas * 0.15));
      const specialtyCount = Math.max(1, totalPizzas - pepCount - cheeseCount - meatCount);

      deliveryItems.push({ name: 'Classic Pepperoni', qty: `${pepCount} Large (14")`, sub: `${pepCount * 8} slices · High demand anchor` });
      deliveryItems.push({ name: 'Classic Cheese / Margherita', qty: `${cheeseCount} Large (14")`, sub: `${cheeseCount * 8} slices · Vegetarian / kid friendly` });
      deliveryItems.push({ name: 'Meat Lovers (Sausage/Bacon)', qty: `${meatCount} Large (14")`, sub: `${meatCount * 8} slices · Savory protein lovers` });
      if (specialtyCount > 0) {
        deliveryItems.push({ name: 'Veggie Supreme or BBQ Chicken', qty: `${specialtyCount} Large (14")`, sub: `${specialtyCount * 8} slices · Custom specialty` });
      }
    }

    // Scratch Dough Recipe Scaling (assuming ~280g dough ball per 12-14" pizza)
    const flourGrams = Math.round(totalPizzas * 175);
    const flourCups = (flourGrams / 125).toFixed(1);
    const waterGrams = Math.round(flourGrams * 0.65);
    const waterCups = (waterGrams / 236).toFixed(1);
    const yeastGrams = (totalPizzas * 1.5).toFixed(1);
    const saltGrams = (totalPizzas * 3.5).toFixed(1);
    const oilTbsp = (totalPizzas * 0.75).toFixed(1);
    const cheeseOz = Math.round(totalPizzas * 8);
    const cheeseLbs = (cheeseOz / 16).toFixed(1);
    const sauceOz = Math.round(totalPizzas * 5);

    const doughItems = [
      { name: 'Bread Flour or 00 Flour', amount: `${flourGrams} g (${flourCups} cups)`, desc: 'High-protein flour for a chewy, airy crust' },
      { name: 'Lukewarm Water (65% hydration)', amount: `${waterGrams} ml (${waterCups} cups)`, desc: 'Ideal for home ovens at 500°F' },
      { name: 'Active Dry or Instant Yeast', amount: `${yeastGrams} g (~${(yeastGrams / 3.1).toFixed(1)} tsp)`, desc: 'Dissolve in water before mixing' },
      { name: 'Fine Kosher Salt', amount: `${saltGrams} g (~${(saltGrams / 5).toFixed(1)} tsp)`, desc: 'Essential for dough flavor structure' },
      { name: 'Extra Virgin Olive Oil', amount: `${oilTbsp} tbsp`, desc: 'Adds tenderness and golden crust browning' },
      { name: 'Whole Milk Mozzarella (Shredded)', amount: `${cheeseOz} oz (${cheeseLbs} lbs)`, desc: 'Low-moisture whole milk melts best' },
      { name: 'Crushed San Marzano Tomato Sauce', amount: `${sauceOz} oz (~${(sauceOz / 8).toFixed(1)} cups)`, desc: 'Seasoned simply with salt, oregano, and basil' }
    ];

    return { totalSlices, totalPizzas, bufferSlices, deliveryItems, doughItems };
  }

  function updateCostSplit() {
    const adults = state.adults || 1;
    const res = calculate();
    const costPerPersonEl = $('#cost-per-person');
    const costPerSliceEl = $('#cost-per-slice');

    if (state.totalCost > 0) {
      const perAdult = (state.totalCost / adults).toFixed(2);
      const totalSlices = res.totalPizzas * 8;
      const perSlice = (state.totalCost / totalSlices).toFixed(2);
      if (costPerPersonEl) costPerPersonEl.textContent = `$${perAdult}`;
      if (costPerSliceEl) costPerSliceEl.textContent = `$${perSlice} / slice`;
    } else {
      if (costPerPersonEl) costPerPersonEl.textContent = '$0.00';
      if (costPerSliceEl) costPerSliceEl.textContent = '$0.00 / slice';
    }
  }

  function render() {
    $('#adults-val').textContent = state.adults;
    $('#kids-val').textContent = state.kids;

    const res = calculate();
    $('#total-pizzas').textContent = res.totalPizzas;
    $('#pizzas-label').textContent = res.totalPizzas === 1 ? 'Large Pizza' : 'Large Pizzas';
    $('#total-slices').textContent = res.totalSlices;

    const summaryBadge = $('#hero-summary-badge');
    if (summaryBadge) {
      if (res.bufferSlices > 0) {
        summaryBadge.textContent = `Includes ${res.bufferSlices} extra slice${res.bufferSlices > 1 ? 's' : ''} for hungry guests`;
        summaryBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        summaryBadge.style.color = '#34D399';
      } else {
        summaryBadge.textContent = 'Exact headcount fit';
        summaryBadge.style.background = 'rgba(245, 158, 11, 0.15)';
        summaryBadge.style.color = '#FBBF24';
      }
    }

    // Toggle Delivery vs Dough cards
    if (state.mode === 'delivery') {
      $('#card-delivery').classList.remove('hidden');
      $('#card-dough').classList.add('hidden');

      const itemsContainer = $('#pizza-items');
      itemsContainer.innerHTML = '';
      res.deliveryItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'pizza-item-card';
        div.innerHTML = `
          <div class="item-top">
            <span class="item-name">${item.name}</span>
            <span class="item-qty">${item.qty}</span>
          </div>
          <span class="item-sub">${item.sub}</span>
        `;
        itemsContainer.appendChild(div);
      });
    } else {
      $('#card-delivery').classList.add('hidden');
      $('#card-dough').classList.remove('hidden');

      const doughContainer = $('#dough-items');
      doughContainer.innerHTML = '';
      res.doughItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.innerHTML = `
          <div class="check-box">✓</div>
          <div class="check-info">
            <div class="check-title">
              <strong>${item.name}</strong>
              <span class="check-amount">${item.amount}</span>
            </div>
            <span class="check-desc">${item.desc}</span>
          </div>
        `;
        doughContainer.appendChild(li);
      });
    }

    updateCostSplit();
    drawPizzaStage(res.totalPizzas);
  }

  // --- Real-Time Pizza Peel Canvas Visualizer ---
  const canvas = $('#pizza-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let animId;
    let steamPuffs = [];

    for (let i = 0; i < 14; i++) {
      steamPuffs.push({
        x: 0.3 + Math.random() * 0.4,
        y: 0.3 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.002,
        vy: -0.003 - Math.random() * 0.004,
        size: 8 + Math.random() * 12,
        alpha: 0.05 + Math.random() * 0.1
      });
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawSinglePizza(cx, cy, radius, flavorType) {
      // 1. Drop shadow
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius * 0.15, radius * 1.05, radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 6, 5, 0.5)';
      ctx.fill();

      // 2. Pizza Crust
      const crustGrad = ctx.createRadialGradient(cx, cy, radius * 0.65, cx, cy, radius);
      crustGrad.addColorStop(0, '#D97706');
      crustGrad.addColorStop(0.75, '#B45309');
      crustGrad.addColorStop(1, '#78350F');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = crustGrad;
      ctx.fill();

      // Char blister spots
      for (let i = 0; i < 8; i++) {
        const ang = (i * 45 + 15) * (Math.PI / 180);
        const bx = cx + Math.cos(ang) * (radius * 0.92);
        const by = cy + Math.sin(ang) * (radius * 0.92);
        ctx.beginPath();
        ctx.ellipse(bx, by, 3, 2, ang, 0, Math.PI * 2);
        ctx.fillStyle = '#29140C';
        ctx.fill();
      }

      // 3. Tomato sauce ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.86, 0, Math.PI * 2);
      ctx.fillStyle = '#991B1B';
      ctx.fill();

      // 4. Melted Mozzarella
      const cheeseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.82);
      cheeseGrad.addColorStop(0, '#FEF3C7');
      cheeseGrad.addColorStop(0.8, '#FDE68A');
      cheeseGrad.addColorStop(1, '#F59E0B');
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
      ctx.fillStyle = cheeseGrad;
      ctx.fill();

      // Cheese browned blisters
      const brownSpots = [
        [-0.3, -0.2, 4], [0.2, 0.4, 5], [-0.1, 0.3, 3],
        [0.4, -0.3, 4], [-0.4, 0.1, 3.5], [0.1, -0.4, 4]
      ];
      brownSpots.forEach(([ox, oy, sz]) => {
        ctx.beginPath();
        ctx.ellipse(cx + ox * radius, cy + oy * radius, sz, sz * 0.7, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#B45309';
        ctx.fill();
      });

      // 5. Toppings (Pepperoni slices)
      if (flavorType === 'pepperoni' || flavorType === 'meat') {
        const pepCoords = [
          [-0.45, -0.2], [-0.1, -0.45], [0.35, -0.35],
          [-0.35, 0.3], [0.15, 0.1], [0.45, 0.25],
          [-0.05, 0.45], [-0.25, -0.1], [0.2, -0.15]
        ];
        pepCoords.forEach(([ox, oy]) => {
          const px = cx + ox * radius;
          const py = cy + oy * radius;
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.16, 0, Math.PI * 2);
          ctx.fillStyle = '#831843';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(px, py, radius * 0.14, 0, Math.PI * 2);
          ctx.fillStyle = '#9F1239';
          ctx.fill();

          // Pepperoni cupping rim
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#4C0519';
          ctx.stroke();
        });
      }

      // Oregano / Basil flakes
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * (radius * 0.75);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#065F46';
        ctx.fill();
      }

      // Cut slice lines (8 slices)
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(74, 25, 12, 0.35)';
      for (let i = 0; i < 4; i++) {
        const ang = (i * 45) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(ang) * radius, cy - Math.sin(ang) * radius);
        ctx.lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
        ctx.stroke();
      }
    }

    function renderPeelAndOven(w, h) {
      // Wood Peel Background
      const peelGrad = ctx.createLinearGradient(0, 0, w, 0);
      peelGrad.addColorStop(0, '#3E2415');
      peelGrad.addColorStop(0.5, '#54321D');
      peelGrad.addColorStop(1, '#2E190E');
      ctx.fillStyle = peelGrad;
      ctx.fillRect(0, 0, w, h);

      // Wood grain lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      for (let y = 10; y < h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y + (Math.sin(y) * 4));
        ctx.lineTo(w, y + (Math.cos(y) * 4));
        ctx.stroke();
      }
    }

    let currentPizzaCount = 4;
    window.drawPizzaStage = function(count) {
      currentPizzaCount = count;
    };

    function animate() {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      renderPeelAndOven(w, h);

      // Layout pizzas based on count
      const count = Math.min(6, currentPizzaCount);
      const cx = w / 2;
      const cy = h / 2;

      if (count === 1) {
        drawSinglePizza(cx, cy, Math.min(w, h) * 0.38, 'pepperoni');
      } else if (count === 2) {
        const rad = Math.min(w, h) * 0.28;
        drawSinglePizza(cx - rad * 0.9, cy, rad, 'pepperoni');
        drawSinglePizza(cx + rad * 0.9, cy, rad, 'cheese');
      } else if (count === 3) {
        const rad = Math.min(w, h) * 0.24;
        drawSinglePizza(cx - rad * 1.3, cy + rad * 0.2, rad, 'pepperoni');
        drawSinglePizza(cx, cy - rad * 0.3, rad, 'cheese');
        drawSinglePizza(cx + rad * 1.3, cy + rad * 0.2, rad, 'meat');
      } else {
        const rad = Math.min(w, h) * 0.22;
        drawSinglePizza(cx - rad * 1.1, cy - rad * 0.6, rad, 'pepperoni');
        drawSinglePizza(cx + rad * 1.1, cy - rad * 0.6, rad, 'cheese');
        drawSinglePizza(cx - rad * 0.7, cy + rad * 0.7, rad, 'meat');
        drawSinglePizza(cx + rad * 0.7, cy + rad * 0.7, rad, 'pepperoni');
      }

      // Rising steam animation
      steamPuffs.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.0015;
        p.size += 0.15;

        if (p.alpha <= 0 || p.y < 0.05) {
          p.x = 0.25 + Math.random() * 0.5;
          p.y = 0.55 + Math.random() * 0.3;
          p.alpha = 0.08 + Math.random() * 0.1;
          p.size = 8 + Math.random() * 10;
        }

        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, p.alpha)})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(animate);
    }

    animate();
  }

  // Copy Order Summary to Clipboard
  const shareBtn = $('#btn-share');
  if (shareBtn) {
    shareBtn.onclick = () => {
      const res = calculate();
      const adults = state.adults;
      const kids = state.kids;
      const pizzas = res.totalPizzas;
      const slices = res.totalSlices;
      const costPerAdult = (state.totalCost > 0 && adults > 0) ? (state.totalCost / adults).toFixed(2) : null;
      const handle = state.paymentHandle ? `\n💸 Venmo/Zelle/CashApp: ${state.paymentHandle}` : '';
      const splitInfo = costPerAdult ? `\n💰 Total: $${state.totalCost.toFixed(2)} ($${costPerAdult} per adult)${handle}` : '';

      const toppingList = res.deliveryItems.map(i => `• ${i.name}: ${i.qty}`).join('\n');

      const text = `🍕 Pizza Party Order Plan (${adults} adults${kids > 0 ? `, ${kids} kids` : ''}):
• Need: ${pizzas} Large Pizzas (~${slices} slices)

Recommended Mix:
${toppingList}${splitInfo}

Calculated with: https://sebiglesias.com.ar/pizza-calculator/`;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          const original = shareBtn.innerHTML;
          shareBtn.innerHTML = '<span>✅</span> Order Copied to Clipboard!';
          shareBtn.style.background = '#059669';
          setTimeout(() => {
            shareBtn.innerHTML = original;
            shareBtn.style.background = '';
          }, 2500);
        });
      }
    };
  }

  // Initial render
  render();
});
