// ==========================================
// الإعدادات العامة
// ==========================================
const storeWhatsappNumber = "966500000000"; // لا تنسَ تعديل الرقم

// ==========================================
// 1. نظام تجميع البيانات (للبحث والصفحة الرئيسية)
// ==========================================
function getAllStoreProducts() {
    let allProducts = [];
    if (typeof schoolProducts !== 'undefined') allProducts.push(...schoolProducts);
    if (typeof summerProducts !== 'undefined') allProducts.push(...summerProducts);
    if (typeof winterProducts !== 'undefined') allProducts.push(...winterProducts);
    if (typeof weddingProducts !== 'undefined') allProducts.push(...weddingProducts);
    if (typeof babiesProducts !== 'undefined') allProducts.push(...babiesProducts);
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
        
        card.innerHTML = `
            <div class="product-image">
                ${badgeHtml}
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="price">${product.price} <span>ريال</span></div>
                <button class="order-whatsapp-btn" onclick='orderViaWhatsapp(${JSON.stringify(product)})'>
                    <i class="fa-brands fa-whatsapp"></i> اطلب الآن
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
// 3. نظام الطلب عبر الواتساب
// ==========================================
function orderViaWhatsapp(product) {
    const message = `مرحباً متجر مواسم،\nأرغب بطلب هذا المنتج:\n📦 اسم المنتج: ${product.name}\n💰 السعر: ${product.price} ريال\nكود المنتج: ${product.id}\n\nهل هو متوفر؟`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${storeWhatsappNumber}?text=${encodedMessage}`, '_blank');
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