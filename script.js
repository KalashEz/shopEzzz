    function showMsg(msg) {
        let div = document.createElement('div');
        div.textContent = msg;
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.left = '20px';
        div.style.backgroundColor = '#333';
        div.style.color = 'white';
        div.style.padding = '10px 20px';
        div.style.borderRadius = '20px';
        div.style.zIndex = '2000';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }

    function renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        products.forEach(p => {
            let avgRating = 0;
            if (p.reviews.length) {
                let sum = p.reviews.reduce((a, b) => a + b.rating, 0);
                avgRating = (sum / p.reviews.length).toFixed(1);
            }
            let stars = '⭐'.repeat(Math.floor(avgRating)) + (avgRating % 1 >= 0.5 ? '½' : '');
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${p.image}" alt="${p.name}" class="product-img" onerror="this.src='https://placehold.co/400x300/0066cc/white?text=${encodeURIComponent(p.name)}'">
                <div class="product-title">${p.name}</div>
                <div class="price">${p.price.toLocaleString()} ₽</div>
                <div class="specs-short">
                    🔹 ${Object.values(p.specs)[0]}<br>
                    🔹 ${Object.values(p.specs)[1] || Object.values(p.specs)[0]}
                </div>
                <div class="rating">⭐ ${avgRating} (${p.reviews.length} отзывов)</div>
                <button class="add-cart-btn" data-id="${p.id}">🛒 В корзину</button>
                <button class="details-btn" data-id="${p.id}">📋 Подробнее</button>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.add-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                addToCart(id);
            });
        });
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                openModal(id);
            });
        });
    }

    function addToCart(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const exist = cart.find(i => i.id === id);
        if (exist) {
            exist.qty++;
        } else {
            cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
        }
        updateCart();
        showMsg(`✅ ${product.name} добавлен в корзину`);
    }

    function updateCart() {
        const cartCount = document.getElementById('cartCount');
        const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
        cartCount.textContent = totalQty;

        const cartItemsDiv = document.getElementById('cartItems');
        const cartTotalDiv = document.getElementById('cartTotal');
        
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p style="text-align: center; color: #999;">Корзина пуста</p>';
            cartTotalDiv.textContent = 'Итого: 0 ₽';
            return;
        }

        let html = '';
        let total = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            html += `
                <div class="cart-item">
                    <div>
                        <strong>${item.name}</strong><br>
                        ${item.price.toLocaleString()} ₽ x ${item.qty} = ${itemTotal.toLocaleString()} ₽
                    </div>
                    <button class="remove-item" data-id="${item.id}" style="background:#dc3545; width:auto; padding:5px 10px;">🗑</button>
                </div>
            `;
        });
        cartItemsDiv.innerHTML = html;
        cartTotalDiv.textContent = `Итого: ${total.toLocaleString()} ₽`;

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                removeFromCart(id);
            });
        });
    }

    function removeFromCart(id) {
        const index = cart.findIndex(i => i.id === id);
        if (index !== -1) {
            cart.splice(index, 1);
            updateCart();
            showMsg('🗑 Товар удалён');
        }
    }

    let currentProductId = null;
    function openModal(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;
        currentProductId = id;
        
        document.getElementById('modalTitle').textContent = product.name;
        
        const specsDiv = document.getElementById('modalSpecs');
        specsDiv.innerHTML = '';
        for (let [key, val] of Object.entries(product.specs)) {
            specsDiv.innerHTML += `<p><strong>${key}:</strong> ${val}</p>`;
        }
        
        renderReviews(product);
        
        document.getElementById('modal').style.display = 'flex';
    }
    
    function renderReviews(product) {
        const reviewsDiv = document.getElementById('modalReviews');
        if (!product.reviews || product.reviews.length === 0) {
            reviewsDiv.innerHTML = '<p>Пока нет отзывов. Будьте первым!</p>';
            return;
        }
        let html = '';
        product.reviews.forEach(r => {
            let stars = '⭐'.repeat(r.rating);
            html += `
                <div class="review">
                    <strong>${escapeHtml(r.author)}</strong> ${stars}<br>
                    ${escapeHtml(r.text)}
                </div>
            `;
        });
        reviewsDiv.innerHTML = html;
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    function addReview() {
        if (!currentProductId) return;
        const product = products.find(p => p.id === currentProductId);
        if (!product) return;
        
        const author = document.getElementById('reviewName').value.trim();
        const rating = parseInt(document.getElementById('reviewRating').value);
        const text = document.getElementById('reviewText').value.trim();
        
        if (!author || !text) {
            showMsg('Заполните имя и текст отзыва');
            return;
        }
        
        product.reviews.push({ author: author, rating: rating, text: text });
        renderReviews(product);
        renderProducts();
        document.getElementById('reviewName').value = '';
        document.getElementById('reviewText').value = '';
        showMsg('Спасибо за отзыв!');
    }
    
    function closeModal() {
        document.getElementById('modal').style.display = 'none';
        currentProductId = null;
    }
    
    function openCart() {
        document.getElementById('cartSidebar').classList.add('open');
        document.getElementById('overlay').classList.add('active');
    }
    function closeCart() {
        document.getElementById('cartSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    }
    
    function checkout() {
        if (cart.length === 0) {
            showMsg('Корзина пуста');
            return;
        }
        const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
        alert(`🎉 Заказ оформлен на сумму ${total.toLocaleString()} ₽. Спасибо!`);
        cart = [];
        updateCart();
        closeCart();
        showMsg('Заказ успешно оформлен');
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        renderProducts();
        
        document.getElementById('openCartBtn').addEventListener('click', openCart);
        document.getElementById('closeCartBtn').addEventListener('click', closeCart);
        document.getElementById('overlay').addEventListener('click', closeCart);
        document.getElementById('checkoutBtn').addEventListener('click', checkout);
        
        const modal = document.getElementById('modal');
        document.getElementById('closeModal').addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        document.getElementById('addReviewBtn').addEventListener('click', addReview);
        document.getElementById('modalAddToCart').addEventListener('click', () => {
            if (currentProductId) {
                addToCart(currentProductId);
                closeModal();
            }
        });
    });