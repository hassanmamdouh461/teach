import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextProps {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

const translations: Record<string, Record<Language, string>> = {
  // Sidebar & Headers
  'Dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'Cashier Board': { en: 'Cashier Board', ar: 'الكاشير' },
  'Kitchen Board': { en: 'Kitchen Board', ar: 'المطبخ' },
  'Drinks Board': { en: 'Drinks Board', ar: 'المشروبات' },
  'Menu': { en: 'Menu', ar: 'القائمة' },
  'Payment & Invoice': { en: 'Payment & Invoice', ar: 'الدفع والفواتير' },
  'Reports': { en: 'Reports', ar: 'التقارير' },
  'Settings': { en: 'Settings', ar: 'الإعدادات' },

  // Board Descriptions
  'Manage order flow, payments and track status.': { en: 'Manage order flow, payments and track status.', ar: 'إدارة تدفق الطلبات، المدفوعات وتتبع الحالة.' },
  'Food items preparing queue.': { en: 'Food items preparing queue.', ar: 'طابور تحضير المأكولات.' },
  'Beverages and coffee preparing queue.': { en: 'Beverages and coffee preparing queue.', ar: 'طابور تحضير المشروبات والقهوة.' },

  // Dashboard Stats & Action
  'Total Revenue': { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
  'Active Orders': { en: 'Active Orders', ar: 'الطلبات النشطة' },
  'Completed Orders': { en: 'Completed Orders', ar: 'الطلبات المكتملة' },
  'Cancelled Orders': { en: 'Cancelled Orders', ar: 'الطلبات الملغاة' },
  'Revenue Trend': { en: 'Revenue Trend', ar: 'منحنى الإيرادات' },
  'Recent Orders': { en: 'Recent Orders', ar: 'أحدث الطلبات' },
  "Today's Revenue": { en: "Today's Revenue", ar: 'إيرادات اليوم' },
  "Today's Revenue (incl. tax)": { en: "Today's Revenue (incl. tax)", ar: 'إيرادات اليوم (شامل الضريبة)' },
  'Average Ticket': { en: 'Average Ticket', ar: 'متوسط الفاتورة' },
  'Active Tables': { en: 'Active Tables', ar: 'الطاولات النشطة' },
  'Top Items': { en: 'Top Items', ar: 'الأصناف الأكثر مبيعاً' },
  'Sales by Category': { en: 'Sales by Category', ar: 'المبيعات حسب التصنيف' },
  'Daily Revenue': { en: 'Daily Revenue', ar: 'الإيرادات اليومية' },
  'Quantity sold': { en: 'Quantity sold', ar: 'الكمية المباعة' },
  'Orders Count': { en: 'Orders Count', ar: 'عدد الطلبات' },
  "Today's Stats": { en: "Today's Stats", ar: 'إحصائيات اليوم' },
  'Overview': { en: 'Overview', ar: 'نظرة عامة' },
  'Total Orders': { en: 'Total Orders', ar: 'إجمالي الطلبات' },
  'Menu Items': { en: 'Menu Items', ar: 'أصناف القائمة' },
  'Recent Activity': { en: 'Recent Activity', ar: 'أحدث النشاطات' },
  'Quick Actions': { en: 'Quick Actions', ar: 'إجراءات سريعة' },
  "Welcome back, here's what's happening today.": { en: "Welcome back, here's what's happening today.", ar: 'أهلاً بك مجدداً، إليك ما يحدث اليوم.' },
  "Today's Date": { en: "Today's Date", ar: 'تاريخ اليوم' },
  'Manage Menu': { en: 'Manage Menu', ar: 'إدارة القائمة' },
  'View Reports': { en: 'View Reports', ar: 'عرض التقارير' },
  'Payment': { en: 'Payment', ar: 'الدفع والفواتير' },
  'Active now': { en: 'Active now', ar: 'نشط الآن' },
  'All clear': { en: 'All clear', ar: 'الكل جاهز' },
  'Daily total': { en: 'Daily total', ar: 'المجموع اليومي' },
  'today': { en: 'today', ar: 'اليوم' },
  'live': { en: 'live', ar: 'مباشر' },
  'available': { en: 'available', ar: 'متوفر' },
  'New order': { en: 'New order', ar: 'طلب جديد' },
  'just now': { en: 'just now', ar: 'الآن' },
  'min ago': { en: 'min ago', ar: 'دقيقة مضت' },
  'h ago': { en: 'h ago', ar: 'ساعة مضت' },
  'No recent activity': { en: 'No recent activity', ar: 'لا توجد نشاطات حديثة' },

  // Orders Page
  'New Orders': { en: 'New Orders', ar: 'الطلبات الجديدة' },
  'Brewing ☕': { en: 'Brewing ☕', ar: 'قيد التحضير ☕' },
  'Ready for Pickup 🛎️': { en: 'Ready for Pickup 🛎️', ar: 'جاهز للاستلام 🛎️' },
  'Cancelled ✕': { en: 'Cancelled ✕', ar: 'ملغى ✕' },
  'New': { en: 'New', ar: 'جديد' },
  'Preparing': { en: 'Preparing', ar: 'قيد التحضير' },
  'Ready': { en: 'Ready', ar: 'جاهز' },
  'Completed': { en: 'Completed', ar: 'مكتمل' },
  'Cancelled': { en: 'Cancelled', ar: 'ملغى' },
  'New Order': { en: 'New Order', ar: 'طلب جديد' },
  'Table': { en: 'Table', ar: 'طاولة' },
  'Takeaway': { en: 'Takeaway', ar: 'take away' },
  'Dine-in': { en: 'Dine-in', ar: 'مطعم' },
  'No orders found': { en: 'No orders found', ar: 'لا توجد طلبات' },
  'Items': { en: 'Items', ar: 'الأصناف' },
  'Cancel Order': { en: 'Cancel Order', ar: 'إلغاء الطلب' },
  'Start Brewing ☕': { en: 'Start Brewing ☕', ar: 'بدء التحضير ☕' },
  'Mark as Ready 🛎️': { en: 'Mark as Ready 🛎️', ar: 'تحديد كجاهز 🛎️' },
  'Complete Order ✅': { en: 'Complete Order ✅', ar: 'إكمال الطلب ✅' },
  'Back to Orders': { en: 'Back to Orders', ar: 'العودة للطلبات' },
  'No items': { en: 'No items', ar: 'لا توجد أصناف' },
  'الوجهة:': { en: 'Destination:', ar: 'الوجهة:' },
  'المطبخ': { en: 'Kitchen', ar: 'المطبخ' },
  'المشروبات': { en: 'Drinks', ar: 'المشروبات' },

  // Payments Page
  'Pending Payments': { en: 'Pending Payments', ar: 'فواتير معلقة' },
  'Paid Invoices': { en: 'Paid Invoices', ar: 'فواتير مدفوعة' },
  'Invoice Payment Status': { en: 'Invoice Payment Status', ar: 'حالة دفع الفواتير' },
  'Open Invoices': { en: 'Open Invoices', ar: 'الفواتير المفتوحة' },
  'Paid vs Open invoices breakdown': { en: 'Paid vs Open invoices breakdown', ar: 'تفصيل الفواتير المدفوعة والمفتوحة' },
  'Total Paid': { en: 'Total Paid', ar: 'إجمالي المدفوع' },
  'Total Open': { en: 'Total Open', ar: 'إجمالي المعلق' },
  'Order Number': { en: 'Order Number', ar: 'رقم الطلب' },
  'Total': { en: 'Total', ar: 'الإجمالي' },
  'Status': { en: 'Status', ar: 'الحالة' },
  'Action': { en: 'Action', ar: 'الإجراء' },
  'Pay': { en: 'Pay', ar: 'دفع' },
  'Unpaid': { en: 'Unpaid', ar: 'غير مدفوع' },
  'Paid': { en: 'Paid', ar: 'مدفوع' },
  'Payment Method': { en: 'Payment Method', ar: 'طريقة الدفع' },
  'Select Payment Method': { en: 'Select Payment Method', ar: 'اختر طريقة الدفع' },
  'Cash': { en: 'Cash', ar: 'نقداً' },
  'Card': { en: 'Card', ar: 'بطاقة' },
  'Complete Payment': { en: 'Complete Payment', ar: 'إتمـام الدفع' },
  'Processing...': { en: 'Processing...', ar: 'جاري المعالجة...' },
  'Invoice': { en: 'Invoice', ar: 'الفاتورة' },
  'Cancel': { en: 'Cancel', ar: 'إلغاء' },
  'Invoice Details': { en: 'Invoice Details', ar: 'تفاصيل الفاتورة' },
  'Print Receipt': { en: 'Print Receipt', ar: 'طباعة الإيصال' },
  'Print Kitchen Ticket': { en: 'Print Kitchen Ticket', ar: 'طباعة بون المطبخ' },
  'Print Drinks Ticket': { en: 'Print Drinks Ticket', ar: 'طباعة بون المشروبات' },
  'Print Invoice': { en: 'Print Invoice', ar: 'طباعة الفاتورة' },
  'Payment Methods': { en: 'Payment Methods', ar: 'طرق الدفع' },
  'Breakdown of paid revenue': { en: 'Breakdown of paid revenue', ar: 'تفصيل الإيرادات المدفوعة' },
  'Total Cash': { en: 'Total Cash', ar: 'إجمالي الكاش' },
  'Total Card': { en: 'Total Card', ar: 'إجمالي الفيزا' },
  'Clear Filter': { en: 'Clear Filter', ar: 'مسح الفلتر' },
  'From Time': { en: 'From Time', ar: 'من وقت' },
  'To Time': { en: 'To Time', ar: 'إلى وقت' },

  // Alerts & Confirms
  'Cancel this order?': { en: 'Cancel this order?', ar: 'هل تريد إلغاء هذا الطلب؟' },
  'هل تريد إلغاء هذا الطلب؟ / Cancel this order?': { en: 'Cancel this order?', ar: 'هل تريد إلغاء هذا الطلب؟' },
  'Confirm': { en: 'Confirm', ar: 'تأكيد' },
  
  // Menu Page
  'Add New Item': { en: 'Add New Item', ar: 'إضافة صنف جديد' },
  'Name': { en: 'Name', ar: 'الاسم' },
  'Price': { en: 'Price', ar: 'السعر' },
  'Category': { en: 'Category', ar: 'التصنيف' },
  'Description': { en: 'Description', ar: 'الوصف' },
  'Available': { en: 'Available', ar: 'متوفر' },
  'Out of Stock': { en: 'Out of Stock', ar: 'غير متوفر' },
  'Edit Item': { en: 'Edit Item', ar: 'تعديل الصنف' },
  'Save Changes': { en: 'Save Changes', ar: 'حفظ التغييرات' },
  'Delete Item': { en: 'Delete Item', ar: 'حذف الصنف' },

  // POS Screen translations
  'Received Amount': { en: 'Received Amount', ar: 'المبلغ المقبوض' },
  'Change for Customer': { en: 'Change for Customer', ar: 'متبقى للزبون' },
  'Payment Status': { en: 'Payment Status', ar: 'حالة الدفع' },
  'Clear / Reset': { en: 'Clear / Reset', ar: 'تراجع' },
  'Invoice Number': { en: 'Invoice Number', ar: 'رقم الفاتورة' },
  'Items Count': { en: 'Items Count', ar: 'عدد الأصناف' },
  'Invoice Date': { en: 'Invoice Date', ar: 'تاريخ الفاتورة' },
  'Save Invoice': { en: 'Save Invoice', ar: 'حفظ الفاتورة' },
  'Exit': { en: 'Exit', ar: 'خروج' },
  'Qty': { en: 'Qty', ar: 'الكمية' },
  'No.': { en: 'No.', ar: 'م' },
  'Item': { en: 'Item', ar: 'الصنف' },
  'Order Mode': { en: 'Order Mode', ar: 'نوع الطلب' },
  'POS View': { en: 'Register Order', ar: 'تسجيل الطلبات' },
  'Order Tracker': { en: 'Order Tracker', ar: 'تتبع الطلبات' },
  'Successfully saved order': { en: 'Successfully saved order', ar: 'تم حفظ الفاتورة بنجاح' },
  'Please add items to invoice first': { en: 'Please add items to invoice first', ar: 'يرجى إضافة أصناف للفاتورة أولاً' },
  'Enter Table Number': { en: 'Enter Table Number', ar: 'أدخل رقم الطاولة' },
  'Dine-in Order': { en: 'Dine-in Order', ar: 'طلب مطعم' },
  'Payment will be processed at the checkout desk later.': { en: 'Payment will be processed at the checkout desk later.', ar: 'سيتم سداد الحساب لاحقاً من صفحة الفواتير.' },
  'Please select table number first': { en: 'Please select table number first', ar: 'يرجى إدخال رقم الطاولة أولاً' },
  'Print & Pay': { en: 'Print & Pay', ar: 'طباعة ودفع' },

  // Menu Page & Cards
  'Menu Management': { en: 'Menu Management', ar: 'إدارة القائمة' },
  'Manage your coffee beverages and availability.': { en: 'Manage your coffee beverages and availability.', ar: 'إدارة أصناف ومشروبات القهوة ومدى توفرها.' },
  'Search items...': { en: 'Search items...', ar: 'بحث عن الأصناف...' },
  'No items found': { en: 'No items found', ar: 'لا توجد أصناف تطابق البحث' },
  'Try adjusting your search or filters.': { en: 'Try adjusting your search or filters.', ar: 'جرب تعديل كلمة البحث أو التصفية.' },
  'Sold Out': { en: 'Sold Out', ar: 'نفذت الكمية' },
  'Unavailable': { en: 'Unavailable', ar: 'غير متوفر' },
  'Edit': { en: 'Edit', ar: 'تعديل' },
  'Delete': { en: 'Delete', ar: 'حذف' },
  'Are you sure you want to delete this item?': { en: 'Are you sure you want to delete this item?', ar: 'هل أنت متأكد من رغبتك في حذف هذا الصنف؟' },
  'Failed to delete item': { en: 'Failed to delete item', ar: 'فشل حذف الصنف' },
  'Failed to save item': { en: 'Failed to save item', ar: 'فشل حفظ الصنف' },
  'Failed to update item availability': { en: 'Failed to update item availability', ar: 'فشل تحديث توفر الصنف' },
  'Failed to load menu': { en: 'Failed to load menu', ar: 'فشل تحميل القائمة' },

  // Menu Modal
  'Item Name': { en: 'Item Name', ar: 'اسم الصنف' },
  'e.g. Spanish Latte': { en: 'e.g. Spanish Latte', ar: 'مثال: سبانش لاتيه' },
  'Brief description of the item...': { en: 'Brief description of the item...', ar: 'وصف مختصر للصنف...' },
  'Image URL': { en: 'Image URL', ar: 'رابط الصورة' },
  'Paste a URL from Unsplash or other image hosts (Optional).': { en: 'Paste a URL from Unsplash or other image hosts (Optional).', ar: 'ألصق رابط صورة من Unsplash أو أي مستضيف آخر (اختياري).' },
  'Create Item': { en: 'Create Item', ar: 'إنشاء صنف جديد' },
  'Failed to save item. Please try again.': { en: 'Failed to save item. Please try again.', ar: 'فشل حفظ الصنف، يرجى المحاولة مرة أخرى.' },

  // Default Categories
  'Hot Coffee': { en: 'Hot Coffee', ar: 'قهوة ساخنة' },
  'Iced Coffee': { en: 'Iced Coffee', ar: 'قهوة باردة' },
  'Frappe': { en: 'Frappe', ar: 'فرابيه' },
  'Milkshakes': { en: 'Milkshakes', ar: 'ميلك شيك' },
  'Food': { en: 'Food', ar: 'مأكولات' },
  'Chicken Meals': { en: 'Chicken Meals', ar: 'وجبات دجاج' },
  'All': { en: 'All', ar: 'الكل' },

  // Default Product Names & Descriptions
  'Espresso': { en: 'Espresso', ar: 'إسبريسو' },
  'Rich, concentrated shot of premium Italian arabica beans.': { en: 'Rich, concentrated shot of premium Italian arabica beans.', ar: 'جرعة غنية ومركزة من حبوب أرابيكا الإيطالية الفاخرة.' },
  'Spanish Latte': { en: 'Spanish Latte', ar: 'سبانش لاتيه' },
  'Espresso with condensed milk and steamed milk.': { en: 'Espresso with condensed milk and steamed milk.', ar: 'إسبريسو مع الحليب المكثف والحليب المبخر.' },
  'Cappuccino': { en: 'Cappuccino', ar: 'كابوتشينو' },
  'Classic Italian coffee with steamed milk foam.': { en: 'Classic Italian coffee with steamed milk foam.', ar: 'قهوة إيطالية كلاسيكية مع رغوة الحليب المبخر.' },
  'Iced Latte': { en: 'Iced Latte', ar: 'لاتيه بارد' },
  'Chilled espresso with cold milk over ice.': { en: 'Chilled espresso with cold milk over ice.', ar: 'إسبريسو مثلج مع الحليب البارد.' },
  'Iced Caramel Macchiato': { en: 'Iced Caramel Macchiato', ar: 'كيراميل ماكياتو بارد' },
  'Vanilla latte with caramel drizzle over ice.': { en: 'Vanilla latte with caramel drizzle over ice.', ar: 'لاتيه الفانيليا مع صوص الكراميل والثلج.' },
  'Mocha Frappe': { en: 'Mocha Frappe', ar: 'موخا فرابيه' },
  'Frozen mocha bliss topped with whipped cream.': { en: 'Frozen mocha bliss topped with whipped cream.', ar: 'مزيج الموكا المثلج اللذيذ مغطى بالكريمة المخفوقة.' },
  'Oreo Milkshake': { en: 'Oreo Milkshake', ar: 'ميلك شيك أوريو' },
  'Cookies and cream frozen delight.': { en: 'Cookies and cream frozen delight.', ar: 'بهجة مثلجة بنكهة الكوكيز والكريمة.' },
  'Strawberry Milkshake': { en: 'Strawberry Milkshake', ar: 'ميلك شيك فراولة' },
  'Fresh strawberries blended with vanilla ice cream.': { en: 'Fresh strawberries blended with vanilla ice cream.', ar: 'فراولة طازجة مخفوقة مع آيس كريم الفانيليا الفاخر.' },

  // Payments Page
  'order #': { en: 'order #', ar: 'طلب رقم ' },
  '✓ Ready to Pay': { en: '✓ Ready to Pay', ar: '✓ جاهز للدفع' },
  'No payable orders found': { en: 'No payable orders found', ar: 'لا توجد طلبات معلقة بانتظار الدفع' },
  'No paid invoices found': { en: 'No paid invoices found', ar: 'لا توجد فواتير مدفوعة' },
  'Search by Table or Order ID...': { en: 'Search by Table or Order ID...', ar: 'البحث برقم الطاولة أو رقم الطلب...' },
  'Failed to load orders': { en: 'Failed to load orders', ar: 'فشل تحميل الطلبات' },

  // Payment Modal
  'Payment Successful': { en: 'Payment Successful', ar: 'تم الدفع بنجاح' },
  'Order ID': { en: 'Order ID', ar: 'رقم الفاتورة' },
  'Total to Pay': { en: 'Total to Pay', ar: 'المجموع المطلوب سداده' },
  'Card / UPI': { en: 'Card / UPI', ar: 'بطاقة' },
  'Payment Received!': { en: 'Payment Received!', ar: 'تم استلام الدفع!' },
  'Transaction completed successfully.': { en: 'Transaction completed successfully.', ar: 'اكتملت المعاملة بنجاح.' },
  '42 Roast Street, Coffee District': { en: '42 Roast Street, Coffee District', ar: '٤٢ شارع التحميص، حي القهوة' },
  'Subtotal': { en: 'Subtotal', ar: 'المجموع الفرعي' },
  'Tax': { en: 'Tax', ar: 'الضريبة' },
  'TOTAL': { en: 'TOTAL', ar: 'الإجمالي الكلي' },
  'Paid via': { en: 'Paid via', ar: 'طريقة الدفع:' },
  'Thank you for choosing BrewMaster! ☕': { en: 'Thank you for choosing BrewMaster! ☕', ar: 'شكراً لاختيارك BrewMaster! ☕' },
  'Done': { en: 'Done', ar: 'تم' },

  // Database Status
  'Checking...': { en: 'Checking...', ar: 'جاري التحقق...' },
  'Verifying local database connection': { en: 'Verifying local database connection', ar: 'جاري التحقق من الاتصال بقاعدة البيانات المحلية' },
  'Local SQLite Connected': { en: 'Local SQLite Connected', ar: 'قاعدة بيانات SQLite المحلية متصلة' },
  'Local SQLite database is connected and fully operational': { en: 'Local SQLite database is connected and fully operational', ar: 'قاعدة البيانات المحلية متصلة وتعمل بكفاءة تامة' },
  'Database Error': { en: 'Database Error', ar: 'خطأ في قاعدة البيانات' },
  'Failed to access local SQLite database': { en: 'Failed to access local SQLite database', ar: 'فشل الاتصال بقاعدة بيانات SQLite المحلية' },
  'Database Status:': { en: 'Database Status:', ar: 'حالة قاعدة البيانات:' },
  'Type:': { en: 'Type:', ar: 'النوع:' },
  'SQLite (Offline Standalone)': { en: 'SQLite (Offline Standalone)', ar: 'قاعدة بيانات SQLite (منفصلة وبدون إنترنت)' },
  'File Storage:': { en: 'File Storage:', ar: 'مسار التخزين:' },
  'brewmaster.db (safe AppData)': { en: 'brewmaster.db (safe AppData)', ar: 'brewmaster.db (محفوظ في بيانات التطبيق)' },
  'Last checked:': { en: 'Last checked:', ar: 'آخر فحص:' },

  // QR Menu Modal
  'QR Code Menu': { en: 'QR Code Menu', ar: 'منيو كود QR للزبائن' },
  'Scan QR Code to view menu': { en: 'Scan QR Code to view menu', ar: 'امسح الرمز لمشاهدة المنيو' },
  'Show or print this code so customers can scan it to browse the menu, pricing, and availability directly on their phones.': {
    en: 'Show or print this code so customers can scan it to browse the menu, pricing, and availability directly on their phones.',
    ar: 'اعرض أو اطبع هذا الرمز ليتمكن الزبائن من مسحه وتصفح المنيو بأسعاره وتوفر الأصناف مباشرة على هواتفهم.'
  },
  'Print Code': { en: 'Print Code', ar: 'طباعة الرمز' },
  'Download Image': { en: 'Download Image', ar: 'تحميل الصورة' },
  'Scan to view menu': { en: 'Scan to view menu', ar: 'امسح لتصفح المنيو' },

  // Reports page
  'Reports & Analytics': { en: 'Reports & Analytics', ar: 'التقارير والإحصائيات' },
  'Track your cafe performance and growth.': { en: 'Track your cafe performance and growth.', ar: 'تتبع أداء ونمو المقهى الخاص بك.' },
  'This Week': { en: 'This Week', ar: 'هذا الأسبوع' },
  'This Month': { en: 'This Month', ar: 'هذا الشهر' },
  'This Year': { en: 'This Year', ar: 'هذه السنة' },
  'Today': { en: 'Today', ar: 'اليوم' },
  'Export': { en: 'Export', ar: 'تصدير' },
  'Top Selling Items': { en: 'Top Selling Items', ar: 'الأصناف الأكثر مبيعاً' },
  'Real orders': { en: 'Real orders', ar: 'الطلب الحقيقي' },
  'Historical baseline': { en: 'Historical baseline', ar: 'الخط المرجعي التاريخي' },
  'this week': { en: 'this week', ar: 'هذا الأسبوع' },
  'this month': { en: 'this month', ar: 'هذا الشهر' },
  'this year': { en: 'this year', ar: 'هذه السنة' },
  'new': { en: 'new', ar: 'جديد' },
  'available now': { en: 'available now', ar: 'متوفر الآن' },
  'completed this week': { en: 'completed this week', ar: 'مكتمل هذا الأسبوع' },
  'completed today': { en: 'completed today', ar: 'مكتمل اليوم' },
  'completed this month': { en: 'completed this month', ar: 'مكتمل هذا الشهر' },
  'completed this year': { en: 'completed this year', ar: 'مكتمل هذه السنة' },
  'new this week': { en: 'new this week', ar: 'جديد هذا الأسبوع' },
  'new today': { en: 'new today', ar: 'جديد اليوم' },
  'new this month': { en: 'new this month', ar: 'جديد هذا الشهر' },
  'new this year': { en: 'new this year', ar: 'جديد هذه السنة' },
  'Lifetime total': { en: 'Lifetime total', ar: 'الإجمالي الكلي' },
  'Total Revenue (incl. tax)': { en: 'Total Revenue (incl. tax)', ar: 'إجمالي الإيرادات (شاملة الضريبة)' },
  'Avg. Order Value': { en: 'Avg. Order Value', ar: 'متوسط قيمة الطلب' },
  'AVG. ORDER VALUE': { en: 'AVG. ORDER VALUE', ar: 'متوسط قيمة الطلب' },
  'TOTAL REVENUE (INCL. TAX)': { en: 'TOTAL REVENUE (INCL. TAX)', ar: 'إجمالي الإيرادات (شامل الضريبة)' },
  'TOTAL ORDERS': { en: 'TOTAL ORDERS', ar: 'إجمالي الطلبات' },
  'MENU ITEMS': { en: 'MENU ITEMS', ar: 'أصناف المنيو' },
  'revenue': { en: 'revenue', ar: 'إيرادات' },
  'Failed to load reports': { en: 'Failed to load reports', ar: 'فشل تحميل التقارير' },
  'Espresso Shot': { en: 'Espresso Shot', ar: 'جرعة إسبريسو' },
  'Mon': { en: 'Mon', ar: 'الإثنين' },
  'Tue': { en: 'Tue', ar: 'الثلاثاء' },
  'Wed': { en: 'Wed', ar: 'الأربعاء' },
  'Thu': { en: 'Thu', ar: 'الخميس' },
  'Fri': { en: 'Fri', ar: 'الجمعة' },
  'Sat': { en: 'Sat', ar: 'السبت' },
  'Sun': { en: 'Sun', ar: 'الأحد' },

  // Settings page
  'Configure application and database settings': { en: 'Configure application and database settings', ar: 'إعدادات التطبيق وقاعدة البيانات' },
  'Profile Settings': { en: 'Profile Settings', ar: 'إعدادات الملف الشخصي' },
  'Update password and controls': { en: 'Update password and controls', ar: 'تحديث كلمة المرور وعناصر التحكم' },
  'Store Configuration': { en: 'Store Configuration', ar: 'إعدادات المتجر' },
  'Manage receipt details and tax rates': { en: 'Manage receipt details and tax rates', ar: 'إدارة بيانات الإيصال ونسب الضرائب' },
  'Alerts & Notifications': { en: 'Alerts & Notifications', ar: 'التنبيهات والإشعارات' },
  'Configure low stock thresholds and sounds': { en: 'Configure low stock thresholds and sounds', ar: 'إعدادات تنبيهات نقص المخزون والأصوات' },
  'Security & Access': { en: 'Security & Access', ar: 'الأمان والصلاحيات' },
  'Manage pin codes and user permissions': { en: 'Manage pin codes and user permissions', ar: 'إدارة رموز الأمان وصلاحيات المستخدمين' },
  'Generate a dynamic QR Code for customers to view the menu': { en: 'Generate a dynamic QR Code for customers to view the menu', ar: 'إنشاء رمز QR تفاعلي للزبائن لتصفح قائمة المأكولات والمشروبات' },
  'Help & Support': { en: 'Help & Support', ar: 'الدعم والمساعدة' },
  'Get help with using the app': { en: 'Get help with using the app', ar: 'احصل على المساعدة في تشغيل واستخدام التطبيق' },
  'Support': { en: 'Support', ar: 'الدعم' },
  'Log Out': { en: 'Log Out', ar: 'تسجيل الخروج' },

  // Missing reports keys
  'orders': { en: 'orders', ar: 'طلبات' },
  'Current status of all': { en: 'Current status of all', ar: 'الحالة الحالية لجميع' },
  'real orders in the system': { en: 'real orders in the system', ar: 'طلب حقيقي بالنظام' },
  'No orders in the system yet': { en: 'No orders in the system yet', ar: 'لا توجد طلبات بالنظام حتى الآن' },
  'Recent Transactions': { en: 'Recent Transactions', ar: 'أحدث المعاملات' },
  'No completed orders': { en: 'No completed orders', ar: 'لا توجد طلبات مكتملة' },
  'Live Kitchen Board': { en: 'Live Kitchen Board', ar: 'لوحة المطبخ المباشرة' },
  'No orders': { en: 'No orders', ar: 'لا توجد طلبات' },
  'Sales by Order Mode': { en: 'Sales by Order Mode', ar: 'المبيعات حسب نوع الطلب' },
  'Dine-in vs Takeaway orders in the selected period': { en: 'Dine-in vs Takeaway orders in the selected period', ar: 'طلبات المطعم مقابل الـ take away خلال الفترة المحددة' },
  'Total Due': { en: 'Total Due', ar: 'المطلوب سداده' },
  'Kitchen': { en: 'Kitchen', ar: 'مطبخ' },
  'Bar': { en: 'Bar', ar: 'بار' }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('brewmaster_lang') as Language) || 'en';
  });

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem('brewmaster_lang', next);
      return next;
    });
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (translation) {
      return translation[language];
    }
    return key;
  };

  const isRtl = language === 'ar';

  useEffect(() => {
    // Set HTML dir attribute for RTL support
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (isRtl) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
