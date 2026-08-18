// ==========================================
// ملف إدارة الأقسام الديناميكية (category.js)
// ==========================================

var STORE_CATEGORIES = {
    'summer': {
        title: 'تشكيلة الصيف المنعشة',
        // نستخدم دالة لجلب المصفوفة حتى لا يحدث خطأ إذا تأخر تحميل ملف القسم
        getData: () => typeof summerProducts !== 'undefined' ? summerProducts : []
    },
    'school': {
        title: 'قسم عودة المدارس',
        getData: () => typeof schoolProducts !== 'undefined' ? schoolProducts : []
    },
    'winter': {
        title: 'تشكيلة الشتاء الدافئة',
        getData: () => typeof winterProducts !== 'undefined' ? winterProducts : []
    },
    'wedding': {
        title: 'قسم الزواج والمناسبات',
        getData: () => typeof weddingProducts !== 'undefined' ? weddingProducts : []
    },
    'babies': {
        title: 'قسم البيبيهات',
        getData: () => typeof babiesProducts !== 'undefined' ? babiesProducts : []
    }
    
};

function initCategoryPage() {
    // 1. قراءة الرابط
    const urlParams = new URLSearchParams(window.location.search);
    // إذا فتحت الصفحة بدون رابط قسم، سيتم توجيهك لقسم الصيف كافتراضي بدلاً من رسالة الخطأ
    const categoryKey = urlParams.get('type') || 'summer';

    const container = document.getElementById('dynamic-category-container');
    const heading = document.getElementById('categoryNameHeading');
    const pageTitle = document.getElementById('pageTitle');

    if (!container || !heading) return;

    // 2. التحقق من وجود القسم في الإعدادات
    if (!STORE_CATEGORIES[categoryKey]) {
        pageTitle.innerText = 'مواسم | قسم غير موجود';
        heading.innerText = 'القسم غير موجود';
        container.innerHTML = '<div style="text-align:center; width:100%; color:#888; padding: 40px 0;">عذراً، لم نتمكن من العثور على هذا القسم.</div>';
        return;
    }

    // 3. جلب بيانات القسم
    const currentCategory = STORE_CATEGORIES[categoryKey];
    const categoryData = currentCategory.getData();
    
    // 4. تحديث نصوص الصفحة
    pageTitle.innerText = `مواسم | ${currentCategory.title}`;
    heading.innerText = currentCategory.title;
    
    // 5. رسم المنتجات
    if (typeof renderProducts === 'function') {
        if (categoryData.length > 0) {
            renderProducts(categoryData, 'dynamic-category-container');
        } else {
            container.innerHTML = '<div style="text-align:center; width:100%; color:#888; padding: 40px 0;">لا توجد منتجات مضافة في هذا القسم حالياً.</div>';
        }
    } else {
        console.error("حدث خطأ: دالة renderProducts غير موجودة. تأكد من استدعاء ملف main.js بشكل صحيح.");
    }
}

// تشغيل الكود بمجرد تحميل الصفحة
document.addEventListener('DOMContentLoaded', initCategoryPage);