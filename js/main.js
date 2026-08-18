// ==========================================
// الإعدادات العامة
// ==========================================
const storeWhatsappNumber = "+201023350404"; // لا تنسَ تعديل الرقم

// ==========================================
// دمج المنتجات المضافة محلياً من لوحة التحكم (Admin) ديناميكياً
// ==========================================
function loadCustomAdminProducts() {
    if (typeof localStorage === 'undefined') return;
    let customProducts = JSON.parse(localStorage.getItem('mawasem_custom_products')) || [];
    
    customProducts.forEach(item => {
        // توقع اسم مصفوفة القسم تلقائياً (مثلاً: summer -> summerProducts)
        const targetArrayName = item.category + 'Products';
        
        // إذا كان ملف القسم مستدعى والمصفوفة موجودة في المتصفح، ادمج المنتج فيها
        if (typeof window[targetArrayName] !== 'undefined' && Array.isArray(window[targetArrayName])) {
            if (!window[targetArrayName].some(p => p.id === item.product.id)) {
                window[targetArrayName].push(item.product);
            }
        }
    });
}
// استدعاء دالة الدمج فور تحميل السكريبت
loadCustomAdminProducts();


// ==========================================
// 1. نظام تجميع البيانات الديناميكي (للبحث والصفحة الرئيسية)
// ==========================================
function getAllStoreProducts() {
    let allProducts = [];
    
    // أ. جلب كل المنتجات من أي ملف قسم جديد أو قديم تلقائياً
    // يقوم بالبحث في المتصفح عن أي مصفوفة ينتهي اسمها بكلمة Products
    for (let key in window) {
        if (typeof key === 'string' && key.endsWith('Products') && Array.isArray(window[key])) {
            if (key !== 'fullProductsList' && key !== 'allProducts') {
                window[key].forEach(prod => {
                    // منع التكرار
                    if (!allProducts.some(p => p.id === prod.id)) {
                        allProducts.push(prod);
                    }
                });
            }
        }
    }

    // ب. جلب المنتجات المستقلة المضافة من لوحة التحكم
    if (typeof localStorage !== 'undefined') {
        let customProducts = JSON.parse(localStorage.getItem('mawasem_custom_products')) || [];
        customProducts.forEach(item => {
            if (!allProducts.some(p => p.id === item.product.id)) {
                allProducts.push(item.product);
            }
        });
    }

    return allProducts;
}


// هذه الدالة التي كانت مفقودة وتسببت في اختفاء منتجات الرئيسية!
function getProductsByStatus(statusKeyword) {
    return getAllStoreProducts().filter(product => product.status === statusKeyword);
}

// ==========================================
// 2. نظام عرض وترتيب المنتجات
// ==========================================
const originalContainerData = {};

function renderProducts(productsArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; 

    // حفظ النسخة الأصلية من المنتجات عند أول تحميل فقط (لعمل فلتر "الافتراضي")
    if (!originalContainerData[containerId]) {
        originalContainerData[containerId] = [...productsArray];
    }
    drawCards(productsArray, container);
}

// ==========================================
// رسم كروت المنتجات
// ==========================================
function drawCards(productsArray, container) {
    container.innerHTML = ''; 

    if(!productsArray || productsArray.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color:#888;">لا توجد منتجات حالياً.</p>';
        return;
    }

    productsArray.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // الشارات
        let badgeHtml = '';
        if (product.status === 'new-arrival') {
            badgeHtml = '<span class="badge new-badge">وصل حديثاً</span>';
        } else if (product.status === 'featured') {
            badgeHtml = '<span class="badge featured-badge">عرض مميز</span>';
        }
        
        // تم التعديل هنا: استبدال زر الواتساب بزر السلة
        card.innerHTML = `
            <div class="product-image">
                ${badgeHtml}
                <img src="${product.image}" alt="${product.name}" loading="lazy" style='width: 100%; height: 100%; object-fit: contain;'>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="price">${product.price} <span>ريال</span></div>
                <button class="add-to-cart-btn" onclick='addToCartAPI("${product.id}")'>
                    🛒 أضف إلى السلة
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function sortProducts(sortType, containerId) {
    const originalArray = originalContainerData[containerId];
    if (!originalArray) return;

    let arrayToSort = [...originalArray];

    if (sortType === 'price-low') {
        arrayToSort.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price-high') {
        arrayToSort.sort((a, b) => b.price - a.price);
    }

    const container = document.getElementById(containerId);
    drawCards(arrayToSort, container);
}

// ==========================================
// 4. قائمة الموبايل (البرجر)
// ==========================================
function toggleMenu() {
    const navContainer = document.querySelector('.seasons-nav .nav-container');
    if (navContainer) {
        navContainer.classList.toggle('show-menu');
    }
}

// ==========================================
// 5. نظام البحث الحي والنتائج
// ==========================================
function setupLiveSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchBarContainer = document.querySelector('.search-bar');
    
    if (!searchInput || !searchBarContainer) return;

    const suggestionsBox = document.createElement('div');
    suggestionsBox.className = 'search-suggestions';
    searchBarContainer.appendChild(suggestionsBox);

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim();
        if (keyword === '') {
            suggestionsBox.style.display = 'none';
            return;
        }

        const matchedProducts = getAllStoreProducts().filter(product => product.name.includes(keyword));
        suggestionsBox.innerHTML = '';

        if (matchedProducts.length > 0) {
            suggestionsBox.style.display = 'block';
            matchedProducts.slice(0, 5).forEach(product => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <span>${product.name}</span>
                `;
                item.addEventListener('click', () => {
                    searchInput.value = product.name;
                    suggestionsBox.style.display = 'none';
                    searchProducts(product.name);
                });
                suggestionsBox.appendChild(item);
            });
        } else {
            suggestionsBox.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchBarContainer.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });

    // تشغيل البحث عند النقر على الزر أو إنتر
    const searchBtn = document.querySelector('.search-bar button');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => searchProducts(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchProducts(searchInput.value);
        });
    }
}

function searchProducts(keyword) {
    if (!keyword || keyword.trim() === '') return;

    const searchResults = getAllStoreProducts().filter(product => product.name.includes(keyword));

    document.querySelectorAll('main.products-section').forEach(section => section.style.display = 'none');
    
    const heroSection = document.querySelector('.hero') || document.querySelector('.hero-slider-container');
    if (heroSection) heroSection.style.display = 'none';

    let searchContainer = document.getElementById('search-results-section');
    
    if (!searchContainer) {
        searchContainer = document.createElement('main');
        searchContainer.id = 'search-results-section';
        searchContainer.className = 'products-section';
        searchContainer.style.marginTop = '40px';
        
        searchContainer.innerHTML = `
            <div class="section-header">
                <h2>نتائج البحث عن: "<span id="search-keyword-display" style="color: var(--primary-color);"></span>"</h2>
            </div>
            <!-- الفلتر الخاص بالبحث -->
            <div class="filter-bar">
                <label><i class="fa-solid fa-arrow-down-short-wide"></i> ترتيب:</label>
                <select onchange="sortProducts(this.value, 'search-results-grid')">
                    <option value="default">الافتراضي</option>
                    <option value="price-low">السعر: من الأقل إلى الأعلى</option>
                    <option value="price-high">السعر: من الأعلى إلى الأقل</option>
                </select>
            </div>
            <div id="search-results-grid" class="products-grid"></div>
        `;
        
        const navElement = document.querySelector('.seasons-nav');
        if (navElement) {
            navElement.parentNode.insertBefore(searchContainer, navElement.nextSibling);
        }
    } else {
        searchContainer.style.display = 'block';
    }

    document.getElementById('search-keyword-display').innerText = keyword;
    renderProducts(searchResults, 'search-results-grid');
}

// ==========================================
// 6. تظليل الرابط النشط تلقائياً
// ==========================================
function highlightActiveNavLink() {
    let currentPage = window.location.pathname.split('/').pop();
    if (currentPage === '' || currentPage === '/') currentPage = 'index.html';
    
    document.querySelectorAll('.seasons-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) link.classList.add('active');
    });
}

// ==========================================
// 7. شريط العروض العلوي المتحرك
// ==========================================
const storeOffers = [
    "🚚 توصيل مجاني للطلبات فوق 200 ريال",
    "🔥 خصم 15% على تشكيلة الصيف - استخدم الكود: SUMMER15",
    "🎁 هدايا مجانية مع كل طلب من قسم الزواج",
    "💳 الدفع عند الاستلام متاح الآن"
];
let currentOfferIndex = 0;

function startOffersSlider() {
    const offerTextElement = document.getElementById('offer-text');
    if (!offerTextElement) return;

    setInterval(() => {
        offerTextElement.style.opacity = 0;
        setTimeout(() => {
            currentOfferIndex = (currentOfferIndex + 1) % storeOffers.length;
            offerTextElement.innerText = storeOffers[currentOfferIndex];
            offerTextElement.style.opacity = 1;
        }, 500);
    }, 3500);
}

// ==========================================
// 8. البانر المتحرك (Hero Slider)
// ==========================================
const heroBanners = [
    { image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop", link: "summer.html" },
    { image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop", link: "school.html" },
    { image: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1200&auto=format&fit=crop", link: "winter.html" }
];
let currentSlideIndex = 0;
let slideInterval;

function initHeroSlider() {
    const slidesContainer = document.getElementById('hero-slides');
    const dotsContainer = document.getElementById('slider-dots');
    
    if (!slidesContainer || !dotsContainer) return; 

    heroBanners.forEach((banner, index) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.innerHTML = `<img src="${banner.image}" alt="عرض ${index + 1}" onclick="window.location.href='${banner.link}'" loading="lazy">`;
        slidesContainer.appendChild(slide);

        const dot = document.createElement('div');
        dot.className = index === 0 ? 'dot active' : 'dot';
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });
    startSlideShow(); 
}

function updateSlider() {
    const slidesContainer = document.getElementById('hero-slides');
    const dots = document.querySelectorAll('.dot');
    if (!slidesContainer) return;

    slidesContainer.style.transform = `translateX(${currentSlideIndex * 100}%)`;
    dots.forEach((dot, index) => {
        dot.className = index === currentSlideIndex ? 'dot active' : 'dot';
    });
}

function moveSlide(direction) {
    clearInterval(slideInterval); 
    currentSlideIndex += direction;
    if (currentSlideIndex >= heroBanners.length) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = heroBanners.length - 1;
    updateSlider();
    startSlideShow(); 
}

function goToSlide(index) {
    clearInterval(slideInterval);
    currentSlideIndex = index;
    updateSlider();
    startSlideShow();
}

function startSlideShow() {
    slideInterval = setInterval(() => moveSlide(1), 4000); 
}

// ==========================================
// 9. مركز التشغيل الآمن (الذي يجمع كل شيء)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. تشغيل الوظائف الأساسية للموقع
    highlightActiveNavLink(); // تظليل القائمة
    setupLiveSearch();        // تشغيل البحث الحي
    startOffersSlider();      // شريط العروض العلوي
    initHeroSlider();         // البانر المتحرك
    
    // 2. تشغيل المنتجات في الصفحة الرئيسية (إذا كانت الحاويات موجودة)
    const newArrivalsContainer = document.getElementById('new-arrivals-container');
    const offersContainer = document.getElementById('offers-container');
    
    if (newArrivalsContainer && offersContainer) {
        // جلب المنتجات حسب حالتها
        const newArrivals = getProductsByStatus('new-arrival');
        const featuredOffers = getProductsByStatus('featured');

        // رسم المنتجات في الصفحة
        renderProducts(newArrivals, 'new-arrivals-container');
        renderProducts(featuredOffers, 'offers-container');
    }

    // 3. تشغيل قسم "كل المنتجات" (موجود في الدالة رقم 10)
    if (typeof initAllProductsSection === 'function') {
        initAllProductsSection();
    }
});


// ==========================================
// 10. نظام عرض "كل المنتجات" مع تحميل المزيد
// ==========================================
let fullProductsList = [];
let displayedProductsCount = 0;
const PRODUCTS_PER_BATCH = 8; // عدد المنتجات في كل ضغطة
let currentAllProductsSort = 'default';

function initAllProductsSection() {
    const container = document.getElementById('all-products-container');
    if (!container) return; // إذا لم يكن في الصفحة الرئيسية يتوقف

    // جلب كل منتجات المتجر
    fullProductsList = getAllStoreProducts();
    // تعيين العدد المبدئي
    displayedProductsCount = PRODUCTS_PER_BATCH;
    
    // رسم المنتجات
    renderPaginatedCards();
}

function renderPaginatedCards() {
    const container = document.getElementById('all-products-container');
    if (!container) return;

    // 1. ترتيب القائمة بالكامل أولاً
    let listToRender = [...fullProductsList];
    if (currentAllProductsSort === 'price-low') {
        listToRender.sort((a, b) => a.price - b.price);
    } else if (currentAllProductsSort === 'price-high') {
        listToRender.sort((a, b) => b.price - a.price);
    }

    // 2. قص القائمة لعرض العدد المطلوب فقط (مثلاً أول 8، ثم 16، الخ)
    const slicedList = listToRender.slice(0, displayedProductsCount);
    
    // 3. استخدام دالة الرسم الأساسية لرسم الكروت
    drawCards(slicedList, container);

    // 4. التحكم في ظهور زر "تحميل المزيد"
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        // إذا عرضنا كل المنتجات، نخفي الزر
        if (displayedProductsCount >= listToRender.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-block';
        }
    }
}

// دالة تعمل عند الضغط على زر "تحميل المزيد"
function loadMoreProducts() {
    displayedProductsCount += PRODUCTS_PER_BATCH; // زيادة العدد بـ 8
    renderPaginatedCards(); // إعادة الرسم
}

// دالة مخصصة لترتيب قسم "كل المنتجات"
function sortAllProducts(sortType) {
    currentAllProductsSort = sortType;
    displayedProductsCount = PRODUCTS_PER_BATCH; // إعادة العدد إلى 8 عند تغيير الترتيب لتجربة مستخدم أفضل
    renderPaginatedCards();
}


////////////////////////////////////////////////////////
//BACKEND//
////////////////////////////////////////////////////////

// ==========================================
// الاتصال بخادم مواسم (Backend Integration)
// ==========================================
const API_BASE_URL = 'https://mawasem-test.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ربط نموذج الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('loginPhone').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone_number: phone, password: password })
                });
                
                const data = await response.json();
                if (response.ok) {
                    // حفظ التوكن في المتصفح
                    localStorage.setItem('mawasem_token', data.access_token);
                    localStorage.setItem('mawasem_username', data.user_name);
                    alert(`مرحباً ${data.user_name}، تم تسجيل الدخول!`);
                    window.location.href = 'index.html'; // التوجيه للصفحة الرئيسية
                } else {
                    alert(`خطأ: ${data.detail}`);
                }
            } catch (error) {
                alert('حدث خطأ في الاتصال بالخادم.');
            }
        });
    }

    // 2. ربط نموذج التسجيل
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const phone = document.getElementById('regPhone').value;
            const password = document.getElementById('regPassword').value;
            
            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name: name, phone_number: phone, password: password })
                });
                
                const data = await response.json();
                if (response.ok) {
                    alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول من النموذج المجاور.');
                    document.getElementById('registerForm').reset();
                } else {
                    alert(`خطأ: ${data.detail}`);
                }
            } catch (error) {
                alert('حدث خطأ في الاتصال بالخادم.');
            }
        });
    }
});

// ==========================================
// دالة إضافة المنتج للسلة (سنستخدمها في ملفات المنتجات)
// ==========================================
async function addToCartAPI(productId, quantity = 1) {
    const token = localStorage.getItem('mawasem_token');
    
    if (!token) {
        alert('يرجى تسجيل الدخول أولاً لتتمكن من إضافة المنتجات للسلة.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });

        const data = await response.json();
        if (response.ok) {
            alert('تمت إضافة المنتج للسلة بنجاح! 🛒');
        } else {
            alert(`خطأ: ${data.detail}`);
        }
    } catch (error) {
        alert('تعذر الاتصال بالخادم.');
    }
}


// فحص حالة المستخدم بمجرد تحميل أي صفحة
document.addEventListener('DOMContentLoaded', () => {
    const authLink = document.getElementById('authLink');
    const token = localStorage.getItem('mawasem_token');
    const username = localStorage.getItem('mawasem_username');

    if (token && username && authLink) {
        authLink.innerHTML = `مرحباً، ${username} (خروج)`;
        authLink.href = "#";
        authLink.onclick = (e) => {
            e.preventDefault();
            if (confirm('هل تريد تسجيل الخروج؟')) {
                localStorage.removeItem('mawasem_token');
                localStorage.removeItem('mawasem_username');
                window.location.reload();
            }
        };
    }
});

// دالة مؤقتة لعرض محتويات السلة عند الضغط عليها
async function openCartModal(e) {
    e.preventDefault();
    const token = localStorage.getItem('mawasem_token');
    if (!token) {
        alert('يرجى تسجيل الدخول أولاً لعرض السلة.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            if (data.cart.length === 0) {
                alert('سلة المشتريات فارغة حالياً 🛒');
            } else {
                let cartDetails = data.cart.map(item => `- منتج رقم: ${item.product_id} (الكمية: ${item.quantity})`).join('\n');
                alert(`محتويات سلتك:\n\n${cartDetails}`);
            }
        } else {
            alert('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.');
            window.location.href = 'login.html';
        }
    } catch (err) {
        alert('تعذر الاتصال بالخادم لجلب السلة.');
    }
}


// ==========================================
// دالة البحث الشاملة عن تفاصيل المنتج (ديناميكية)
// ==========================================
function getProductDetails(productId) {
    // نستخدم دالة التجميع الشاملة للبحث عن المنتج في جميع الأقسام واللوحة الخاصة
    const allStoreProducts = getAllStoreProducts();
    const foundProduct = allStoreProducts.find(p => String(p.id) === String(productId));
    
    if (foundProduct) {
        return foundProduct;
    }

    // 3. في حال لم يتم العثور عليه نهائياً (منتج محذوف مثلاً)
    return { 
        name: `منتج غير متوفر (رمز: ${productId})`, 
        price: 0, 
        image: "https://via.placeholder.com/80?text=Mawasem" 
    };
}
// ==========================================
// عرض محتويات صفحة السلة وحساب الإجمالي
// ==========================================
async function loadUserCart() {
    const token = localStorage.getItem('mawasem_token');
    const container = document.getElementById('cartItemsContainer');
    const summary = document.getElementById('cartSummary');
    const countBadge = document.getElementById('cartCountBadge');
    
    const subTotalElement = document.getElementById('subTotal');
    const finalTotalElement = document.getElementById('finalTotal');
    const deliveryDisplay = document.getElementById('deliveryFeeDisplay');

    if (!container) return;

    if (!token) {
        container.innerHTML = '<div class="empty-cart-msg">يرجى تسجيل الدخول لرؤية سلتك. <br><br> <a href="login.html" style="color:#ff9800;">تسجيل الدخول</a></div>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            const cartItems = data.cart;
            
            if (cartItems.length === 0) {
                container.innerHTML = '<div class="empty-cart-msg">سلة المشتريات فارغة حالياً 🛒<br><br><a href="index.html" style="color:#ff9800;">تصفح المنتجات</a></div>';
                if (summary) summary.style.display = 'none';
                if (countBadge) countBadge.innerText = '0 منتجات';
                return;
            }

            container.innerHTML = '';
            if (countBadge) countBadge.innerText = `${cartItems.length} منتجات`;
            
            let totalPrice = 0;

            cartItems.forEach(item => {
                const product = getProductDetails(item.product_id);
                const itemTotal = product.price * item.quantity;
                totalPrice += itemTotal;

                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <div class="item-details">
                        <div class="item-title">${product.name}</div>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', ${item.quantity - 1})">-</button>
                            <span class="qty-number">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', ${item.quantity + 1})">+</button>
                        </div>
                        <div class="item-price-qty">السعر للوحدة: ${product.price} ريال</div>
                    </div>
                    <div class="item-total">${itemTotal} ريال</div>
                    <button class="remove-btn" onclick="removeFromCartAPI('${item.product_id}')" title="حذف المنتج">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
                container.appendChild(itemDiv);
            });
            
            // جلب رسوم التوصيل وحساب الإجمالي النهائي
            let deliveryCost = 0;
            try {
                const resFee = await fetch(`${API_BASE_URL}/settings/delivery`);
                const dataFee = await resFee.json();
                const feeValue = dataFee.delivery_fee;
                
                if (isNaN(feeValue) || feeValue.trim() === "مجاني" || feeValue.trim() === "0") {
                    if (deliveryDisplay) deliveryDisplay.innerText = "مجاني";
                    deliveryCost = 0;
                } else {
                    deliveryCost = parseFloat(feeValue);
                    if (deliveryDisplay) deliveryDisplay.innerText = `${deliveryCost} ريال`;
                }
            } catch (e) {
                if (deliveryDisplay) deliveryDisplay.innerText = "مجاني";
            }

            const grandTotal = totalPrice + deliveryCost;
            if (subTotalElement) subTotalElement.innerText = `${totalPrice} ريال`;
            if (finalTotalElement) finalTotalElement.innerText = `${grandTotal} ريال`;
            if (summary) summary.style.display = 'block';

        } else {
            container.innerHTML = `<div class="empty-cart-msg">حدث خطأ: ${data.detail}</div>`;
            if (response.status === 401) {
                localStorage.removeItem('mawasem_token');
            }
        }
    } catch (error) {
        container.innerHTML = '<div class="empty-cart-msg">تعذر الاتصال بالخادم. تأكد من تشغيل الـ Backend.</div>';
    }
}


// ==========================================
// دالة إتمام الطلب وتنسيق الرسالة للواتساب
// ==========================================
async function checkoutOrder() {
    const token = localStorage.getItem('mawasem_token');
    
    if (!token) {
        alert('يرجى تسجيل الدخول أولاً لإتمام الطلب.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // 1. جلب سلة المشتريات من الخادم
        const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok || !data.cart || data.cart.length === 0) {
            alert('سلة المشتريات فارغة أو حدث خطأ في جلب البيانات.');
            return;
        }

        const cartItems = data.cart;
        let customerName = localStorage.getItem('mawasem_username') || 'عميل';
        
        let subTotal = 0;
        let itemsListText = "";

        // 2. تجميع تفاصيل المنتجات وحساب المجموع الفرعي
        cartItems.forEach((item, index) => {
            const product = getProductDetails(item.product_id);
            const itemTotal = product.price * item.quantity;
            subTotal += itemTotal;

            itemsListText += `${index + 1}. *${product.name}*\n   - الكمية: ${item.quantity}\n   - السعر: ${itemTotal} ريال\n\n`;
        });

        // 3. جلب رسوم التوصيل الحالية
        let deliveryFeeText = "مجاني";
        let deliveryCost = 0;
        try {
            const resFee = await fetch(`${API_BASE_URL}/settings/delivery`);
            const dataFee = await resFee.json();
            const feeValue = dataFee.delivery_fee;
            
            if (!isNaN(feeValue) && feeValue.trim() !== "مجاني" && feeValue.trim() !== "0") {
                deliveryCost = parseFloat(feeValue);
                deliveryFeeText = `${deliveryCost} ريال`;
            }
        } catch (e) {
            deliveryFeeText = "مجاني";
        }

        const finalTotal = subTotal + deliveryCost;

        // 4. بناء نص الرسالة بتنسيق احترافي للواتساب
        let whatsappMessage = `🛒 *طلب جديد من متجر مواسم*\n`;
        whatsappMessage += `--------------------------------\n`;
        whatsappMessage += `👤 *اسم العميل:* ${customerName}\n\n`;
        whatsappMessage += `📦 *المنتجات المطلوبة:*\n`;
        whatsappMessage += itemsListText;
        whatsappMessage += `--------------------------------\n`;
        whatsappMessage += `💰 *المجموع الفرعي:* ${subTotal} ريال\n`;
        whatsappMessage += `🚚 *رسوم التوصيل:* ${deliveryFeeText}\n`;
        whatsappMessage += `🏷️ *الإجمالي الكلي:* *${finalTotal} ريال*\n`;
        whatsappMessage += `--------------------------------\n`;
        whatsappMessage += `أرغب في إتمام هذا الطلب وتأكيد عنوان الشحن.`;

        // 5. ترميز النص وتوجيه العميل إلى تطبيق/موقع الواتساب
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappUrl = `https://wa.me/${storeWhatsappNumber}?text=${encodedMessage}`;

        // فتح الواتساب في نافذة جديدة
        window.open(whatsappUrl, '_blank');

    } catch (error) {
        alert('تعذر إتمام الطلب، تأكد من الاتصال بالخادم.');
    }
}

// ==========================================
// تحديث أيقونة المستخدم في الهيدر (القائمة المنسدلة)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const authLink = document.getElementById('authLink');
    const token = localStorage.getItem('mawasem_token');
    const username = localStorage.getItem('mawasem_username');

    if (token && username && authLink) {
        // استخراج الاسم الأول فقط
        const firstName = username.split(' ')[0];
        
        // استبدال كود الأيقونة القديم بزر دائري وقائمة منسدلة
        authLink.outerHTML = `
            <div class="user-menu-container">
                <div class="logged-in-badge" id="userMenuBtn" title="حسابي">
                    <i class="fa-solid fa-user"></i>
                    <span>مرحباً، ${firstName}</span>
                    <i class="fa-solid fa-chevron-down" style="font-size: 0.7em; margin-right: 3px; color: #888;"></i>
                </div>
                
                <div class="user-dropdown-menu" id="userDropdown">
                    <div class="user-dropdown-item" id="logoutBtn">
                        <i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج
                    </div>
                </div>
            </div>
        `;

        // 1. تفعيل زر القائمة لفتح وإغلاق المنسدلة
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.getElementById('logoutBtn');

        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // منع إغلاق القائمة فوراً
                userDropdown.classList.toggle('show');
            });

            // 2. إغلاق القائمة عند النقر في أي مكان آخر بالشاشة
            document.addEventListener('click', (e) => {
                if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            });
        }

        // 3. تفعيل زر تسجيل الخروج بدون نافذة مزعجة
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('mawasem_token');
                localStorage.removeItem('mawasem_username');
                window.location.reload(); // إعادة تحميل الصفحة للعودة لحالة الزائر
            });
        }
    }
});


// ==========================================
// دالة حذف منتج من السلة
// ==========================================
async function removeFromCartAPI(productId) {
    // رسالة تأكيد قبل الحذف
    if (!confirm('هل أنت متأكد من حذف هذا المنتج من السلة؟')) return;

    const token = localStorage.getItem('mawasem_token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/cart/remove/${productId}`, {
            method: 'DELETE', // نوع الطلب DELETE
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // إعادة تحميل السلة فوراً لتحديث الإجمالي وإخفاء المنتج المحذوف
            loadUserCart();
        } else {
            const data = await response.json();
            alert(`خطأ: ${data.detail}`);
        }
    } catch (error) {
        alert('تعذر الاتصال بالخادم لحذف المنتج.');
    }
}

// ==========================================
// دالة تحديث كمية المنتج في السلة (+ و -)
// ==========================================
async function updateCartQuantity(productId, newQuantity) {
    // إذا ضغط المستخدم على ناقص (-) والكمية 1، نحول الأمر لدالة الحذف
    if (newQuantity <= 0) {
        removeFromCartAPI(productId);
        return;
    }

    const token = localStorage.getItem('mawasem_token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/cart/update/${productId}?quantity=${newQuantity}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // إعادة تحميل السلة لتحديث الأسعار فوراً
            loadUserCart();
        } else {
            const data = await response.json();
            alert(`خطأ: ${data.detail}`);
        }
    } catch (error) {
        alert('تعذر الاتصال بالخادم لتحديث الكمية.');
    }
}