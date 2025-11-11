this.saleId<script>
export default {
  name: 'InvoiceModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    saleId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      submitting: false,
      error: null,
      customerOptions: [],
      isLoadingCustomerData: false,
      form: {
        invoice_date: '',
        invoice_number: '',

        our_company_name: '',
        our_company_national_id: '',
        our_company_register_no: '',
        our_company_commercial_code: '',
        our_company_address: '',
        our_company_postal_code: '',
        our_company_phone: '',

        customer_name: '',
        customer_national_id: '',
        customer_register_number: '',
        customer_commercial_code: '',
        customer_address: '',
        customer_postal_code: '',
        customer_phone: '',

        product_id: '',
        product_description: '',
        net_weight: '',
        unit: '',
        price_per_kg: '',
        total_price: '',
        extra_cost: '',
        total_price_after_off: '',
        tax: '',
        total_price_after_tax: '',
      },
    }
  },
  watch: {
    show(val) {
      if (val) {
        this.initialize()
      } else {
        this.resetForm()
      }
    },
    saleId(val) {
      if (this.show && val) {
        this.initialize()
      }
    },
    'form.customer_name'(newVal) {
      if (newVal && !this.isLoadingCustomerData) {
        this.loadCustomerData(newVal)
      }
    },
  },
  mounted() {
  },
  methods: {
    async initialize() {
      if (!this.saleId) {
        this.resetForm()
        return
      }
      this.error = null
      this.loading = true
      try {
        await this.fetchCustomers()
        await this.loadInvoiceData()
      } catch (error) {
        console.error('Failed to load invoice data:', error)
        this.error = 'خطا در دریافت اطلاعات فاکتور فروش. لطفا دوباره تلاش کنید.'
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.error = null
      this.loading = false
      this.submitting = false
      this.form = {
        invoice_date: this.form.invoice_date || this.getToday(),
        invoice_number: '',

        our_company_name: '',
        our_company_national_id: '',
        our_company_register_no: '',
        our_company_commercial_code: '',
        our_company_address: '',
        our_company_postal_code: '',
        our_company_phone: '',

        customer_name: '',
        customer_national_id: '',
        customer_register_number: '',
        customer_commercial_code: '',
        customer_address: '',
        customer_postal_code: '',
        customer_phone: '',

        product_id: '',
        product_description: '',
        net_weight: '',
        unit: '',
        price_per_kg: '',
        total_price: '',
        extra_cost: '',
        total_price_after_off: '',
        tax: '',
        total_price_after_tax: '',
      }
    },
    getToday() {
      const now = new Date()
      return now.toLocaleDateString('fa-IR')
    },
    ensureOption(options, value) {
      if (value && !options.includes(value)) {
        options.unshift(value)
      }
    },
    async loadInvoiceData() {
      this.isLoadingCustomerData = true
      try {
      const { data } = await this.axios.get('/myapp/api/getInvoiceData', {
          params: { 
            sale_id: this.saleId 
          },
      })

      const payload = data?.values || {}

        this.form.invoice_date = payload.invoice_date || this.getToday()
      this.form.invoice_number = payload.invoice_number || ''

        this.form.our_company_name = payload.our_company_name || ''
        this.form.our_company_national_id = payload.our_company_national_id || ''
        this.form.our_company_register_no = payload.our_company_register_no || ''
        this.form.our_company_commercial_code = payload.our_company_commercial_code || ''
        this.form.our_company_address = payload.our_company_address || ''
        this.form.our_company_postal_code = payload.our_company_postal_code || ''
        this.form.our_company_phone = payload.our_company_phone || ''

      this.form.customer_name = payload.customer_name || ''
        this.form.customer_national_id = payload.customer_national_id || ''
        this.form.customer_register_number = payload.customer_register_number || ''
        this.form.customer_commercial_code = payload.customer_commercial_code || ''
        this.form.customer_address = payload.customer_address || ''
        this.form.customer_postal_code = payload.customer_postal_code || ''
        this.form.customer_phone = payload.customer_phone || ''

      this.form.product_id = payload.product_id || ''
        this.form.product_description = payload.product_description || ''
      this.form.net_weight = payload.net_weight || ''
      this.form.unit = payload.unit || ''
      this.form.price_per_kg = payload.price_per_kg || ''
      this.form.total_price = payload.total_price || ''
      this.form.extra_cost = payload.extra_cost || ''
      this.form.total_price_after_off = payload.total_price_after_off || ''
      this.form.tax = payload.tax || ''
      this.form.total_price_after_tax = payload.total_price_after_tax || ''
      } finally {
        this.isLoadingCustomerData = false
        if (this.form.customer_name) {
          await this.loadCustomerData(this.form.customer_name)
        }
      }
    },
    async fetchCustomers() {
      try {
        const { data } = await this.axios.get('/myapp/api/getCustomerNames')
        this.customerOptions = Array.isArray(data?.customer_data) ? [...data.customer_data] : []
        this.ensureOption(this.customerOptions, this.form.customer_name)
      } catch (error) {
        console.error('Failed to load customer names:', error)
      }
    },
    formatNumber(value) {
      if (value === null || value === undefined || value === '') {
        return ''
      }
      const normalized = typeof value === 'string' ? value.replace(/,/g, '') : value
      const numberValue = Number(normalized)
      if (Number.isNaN(numberValue)) {
        return value
      }
      return numberValue.toLocaleString('fa-IR')
    },
    async loadCustomerData(customerName) {
      if (!customerName) {
        return
      }
      try {
        const { data } = await this.axios.get('/myapp/api/getCustomerData', {
          params: { customer_name: customerName },
        })
        const customer = data?.customer_names || {}
        if (customer) {
          this.form.customer_national_id = customer.national_id || ''
          this.form.customer_register_number = customer.register_no || customer.register_number || ''
          this.form.customer_commercial_code = customer.commercial_code || ''
          this.form.customer_address = customer.address || ''
          this.form.customer_postal_code = customer.postal_code || ''
          this.form.customer_phone = customer.phone || ''
        }
      } catch (error) {
        console.error('Failed to load customer data:', error)
      }
    },
    closeModal() {
      this.$emit('close')
    },
    async handlePrint() {
      if (this.submitting) {
        return
      }

      if (!this.form.invoice_number) {
        this.error = 'لطفا شماره فاکتور را وارد کنید.'
        return
      }

      this.error = null
      this.submitting = true

      const payload = {
        invoice_date: this.form.invoice_date,
        invoice_number: this.form.invoice_number,

        our_company_name: this.form.our_company_name,
        our_company_national_id: this.form.our_company_national_id,
        our_company_register_no: this.form.our_company_register_no,
        our_company_commercial_code: this.form.our_company_commercial_code,
        our_company_address: this.form.our_company_address,
        our_company_postal_code: this.form.our_company_postal_code,
        our_company_phone: this.form.our_company_phone,

        customer_name: this.form.customer_name,
        customer_national_id: this.form.customer_national_id,
        customer_register_number: this.form.customer_register_number,
        customer_commercial_code: this.form.customer_commercial_code,
        customer_address: this.form.customer_address,
        customer_postal_code: this.form.customer_postal_code,
        customer_phone: this.form.customer_phone,

        product_id: this.form.product_id,
        product_description: this.form.product_description,
        net_weight: this.form.net_weight,
        unit: this.form.unit,
        price_per_kg: this.form.price_per_kg,
        total_price: this.form.total_price,
        extra_cost: this.form.extra_cost,
        total_price_after_off: this.form.total_price_after_off,
        tax: this.form.tax,
        total_price_after_tax: this.form.total_price_after_tax,
      }

      try {
        await this.axios.post('/myapp/api/generateInvoice', payload, {
          params: { sale_id: this.saleId },
        })
        this.openPrintPreview()
      } catch (error) {
        console.error('Failed to generate invoice:', error)
        this.error = 'خطا در ایجاد فایل فاکتور فروش. لطفا دوباره تلاش کنید.'
      } finally {
        this.submitting = false
      }
    },
    escapeHtml(value) {
      if (value === null || value === undefined) {
        return ''
      }
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },
    openPrintPreview() {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        this.error = 'مرورگر اجازه باز کردن صفحه چاپ را نداد. لطفا پاپ‌آپ‌ها را فعال کنید.'
        return
      }

      const safeText = (value, fallback = '') => {
        const text =
          value === null || value === undefined || value === '' ? fallback : String(value)
        return this.escapeHtml(text)
      }
      const numberOrDash = (value, fallback = '-') => {
        const formatted = this.formatNumber(value)
        if (formatted === '') {
          return this.escapeHtml(fallback)
        }
        return this.escapeHtml(formatted)
      }
      const numberOrZero = (value) => numberOrDash(value, '0')

      const html = `<!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>صورت حساب فروش کالا</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { 
              font-family: 'Tahoma', sans-serif; 
              margin: 0; 
              padding: 0; 
              color: #000; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
            .invoice-wrapper { 
              width: 100%; 
              padding: 0 10px; 
              display: flex;
              flex-direction: column;
              justify-content: center;
              min-height: 100vh;
            }
            .main-table { 
              width: 98%; 
              margin: 0 auto;
              border-collapse: collapse; 
            }
            .main-table > tbody > tr > td { padding: 0; border: none; }
            
            .nested-table { width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11px; }
            .nested-table th,
            .nested-table td { padding: 4px 6px; vertical-align: middle; }
            
            .title-row th { 
              font-size: 16px; 
              text-align: center; 
              padding: 8px 0; 
              border: 1px solid #000;
            }
            
            .section-title th { 
              background: #d9d9d9; 
              font-weight: bold; 
              text-align: center; 
              border: 1px solid #000;
              padding: 6px 8px;
            }
            
            .info-table { border: none; }
            .info-table td { border: none; padding: 5px; }
            .label-cell { 
              font-weight: bold; 
              width: 150px;
              text-align: right;
            }
            .label-cell-grey { 
              background: #f0f0f0; 
              font-weight: bold; 
              width: 120px;
              text-align: right;
            }
            .value-cell { text-align: right; width: auto; }
            
            .meta-box-cell { 
              vertical-align: top; 
              background: #f7f7f7; 
              border: 1px solid #000;
              width: 200px;
            }
            .meta-box { 
              display: flex; 
              flex-direction: column; 
              gap: 8px; 
              padding: 14px; 
              direction: rtl; 
              text-align: right; 
            }
            .meta-item { 
              display: flex; 
              align-items: center; 
              gap: 10px; 
              font-weight: bold; 
            }
            .meta-label { min-width: 60px; }
            .meta-value { font-weight: normal; }
            
            .product-header th { 
              background: #d9d9d9; 
              text-align: center; 
              border: 1px solid #000;
            }
            .product-cell { text-align: center; border: 1px solid #000; }
            .product-desc { text-align: right; border: 1px solid #000; }
            .totals-row td { 
              font-weight: bold; 
              text-align: center; 
              border: 1px solid #000;
            }
            .amount-row td { 
              font-weight: bold; 
              border: 1px solid #000;
            }
            .payment-signature-row td { 
              border: 1px solid #000;
              vertical-align: top;
              padding: 12px;
            }
            .payment-info {
              text-align: right;
              font-weight: bold;
              line-height: 2;
            }
            .signature-box {
              padding: 12px;
              min-height: 60px;
              display: flex;
              justify-content: space-around;
              align-items: center;
              gap: 40px;
            }
            .signature-item {
              text-align: center;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <table class="main-table" cellspacing="0" cellpadding="0">
              <tbody>
                <!-- Title Row -->
                <tr>
                  <td>
                    <table class="nested-table" cellspacing="0" cellpadding="0">
                      <tr class="title-row">
                        <th>صورت حساب فروش کالا</th>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Seller Info with Meta Box -->
                <tr>
                  <td>
                    <table class="nested-table" cellspacing="0" cellpadding="0">
                      <tr class="section-title">
                        <th colspan="2">مشخصات فروشنده</th>
                      </tr>
                      <tr>
                        <td style="width: 100%; padding: 0; vertical-align: top;">
                          <table class="info-table" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td class="label-cell">نام شخص حقیقی / حقوقی</td>
                              <td class="value-cell">${safeText(this.form.our_company_name, '-')}</td>
                              <td class="label-cell">کد اقتصادی</td>
                              <td class="value-cell">${safeText(this.form.our_company_commercial_code, '-')}</td>
                              <td class="label-cell">شماره ثبت</td>
                              <td class="value-cell">${safeText(this.form.our_company_register_no, '-')}</td>
                            </tr>
                            <tr>
                              <td class="label-cell">شناسه ملی</td>
                              <td class="value-cell">${safeText(this.form.our_company_national_id, '-')}</td>
                              <td class="label-cell">کد پستی</td>
                              <td class="value-cell">${safeText(this.form.our_company_postal_code, '-')}</td>
                              <td class="label-cell">تلفن/ایمیل</td>
                              <td class="value-cell">${safeText(this.form.our_company_phone, '-')}</td>
                            </tr>
                            <tr>
                              <td class="label-cell">نشانی</td>
                              <td colspan="5" class="value-cell">${safeText(this.form.our_company_address, '-')}</td>
                            </tr>
                          </table>
                        </td>
                        <td class="meta-box-cell">
                          <div class="meta-box">
                            <div class="meta-item">
                              <span class="meta-label">شماره</span>
                              <span class="meta-value">${safeText(this.form.invoice_number, '-')}</span>
                            </div>
                            <div class="meta-item">
                              <span class="meta-label">تاریخ</span>
                              <span class="meta-value">${safeText(this.form.invoice_date, '-')}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Buyer Info -->
                <tr>
                  <td>
                    <table class="nested-table" cellspacing="0" cellpadding="0">
                      <tr class="section-title">
                        <th>مشخصات خریدار</th>
                      </tr>
                      <tr>
                        <td style="padding: 0;">
                          <table class="info-table" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td class="label-cell">نام شخص حقیقی / حقوقی</td>
                              <td class="value-cell">${safeText(this.form.customer_name, '-')}</td>
                              <td class="label-cell">کد اقتصادی</td>
                              <td class="value-cell">${safeText(this.form.customer_commercial_code, '-')}</td>
                              <td class="label-cell">شماره ثبت</td>
                              <td class="value-cell">${safeText(this.form.customer_register_number, '-')}</td>
                            </tr>
                            <tr>
                              <td class="label-cell">شناسه ملی</td>
                              <td class="value-cell">${safeText(this.form.customer_national_id, '-')}</td>
                              <td class="label-cell">کد پستی</td>
                              <td class="value-cell">${safeText(this.form.customer_postal_code, '-')}</td>
                              <td class="label-cell">تلفن/ایمیل</td>
                              <td class="value-cell">${safeText(this.form.customer_phone, '-')}</td>
                            </tr>
                            <tr>
                              <td class="label-cell">نشانی</td>
                              <td colspan="5" class="value-cell">${safeText(this.form.customer_address, '-')}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Product Table -->
                <tr>
                  <td>
                    <table class="nested-table" cellspacing="0" cellpadding="0">
                      <tr class="section-title">
                        <th colspan="13">مشخصات کالا</th>
                      </tr>
                      <tr class="product-header">
                        <th style="width: 3%;">ردیف</th>
                        <th style="width: 6%;">کد کالا</th>
                        <th colspan="3" style="width: 24%;">شرح کالا یا خدمت</th>
                        <th style="width: 7%;">مقدار</th>
                        <th style="width: 6%;">واحد</th>
                        <th style="width: 8%;">قیمت واحد</th>
                        <th style="width: 8%;">مبلغ کل</th>
                        <th style="width: 10%;">مبلغ کل پس از تخفیف</th>
                        <th style="width: 8%;">جمع مبلغ کل</th>
                        <th style="width: 10%;">جمع مالیات و عوارض ۱۰٪</th>
                        <th style="width: 10%;">جمع مبلغ کل و مالیات</th>
                      </tr>
                      <tr>
                        <td class="product-cell">1</td>
                        <td class="product-cell">${safeText(this.form.product_id, '-')}</td>
                        <td colspan="3" class="product-desc">${safeText(this.form.product_description, '-')}</td>
                        <td class="product-cell">${numberOrDash(this.form.net_weight)}</td>
                        <td class="product-cell">${safeText(this.form.unit, '-')}</td>
                        <td class="product-cell">${numberOrDash(this.form.price_per_kg)}</td>
                        <td class="product-cell">${numberOrZero(this.form.total_price)}</td>
                        <td class="product-cell">${numberOrZero(this.form.total_price_after_off)}</td>
                        <td class="product-cell">${numberOrZero(this.form.total_price_after_off)}</td>
                        <td class="product-cell">${numberOrZero(this.form.tax)}</td>
                        <td class="product-cell">${numberOrZero(this.form.total_price_after_tax)}</td>
                      </tr>
                      ${Array.from({ length: 4 }).map(() => `
                      <tr>
                        <td class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                        <td colspan="3" class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                        <td class="product-cell">&nbsp;</td>
                      </tr>`).join('')}
                      <tr class="totals-row">
                        <td colspan="8" style="text-align: right;">جمع کل</td>
                        <td>${numberOrZero(this.form.total_price)}</td>
                        <td>${numberOrZero(this.form.total_price_after_off)}</td>
                        <td>${numberOrZero(this.form.total_price_after_off)}</td>
                        <td>${numberOrZero(this.form.tax)}</td>
                        <td>${numberOrZero(this.form.total_price_after_tax)}</td>
                      </tr>
                      <tr class="payment-signature-row">
                        <td colspan="8" style="text-align: right;">
                          <div class="signature-box">
                            <div class="signature-item">مهر و امضاء فروشنده</div>
                            <div class="signature-item">مهر و امضاء خریدار</div>
                          </div>
                        </td>
                        <td colspan="5" style="text-align: right; vertical-align: middle;">
                          <div class="payment-info">
                            <div>مبلغ قابل پرداخت (به عدد): ${numberOrZero(this.form.total_price_after_tax)}</div>
                            <div>مبلغ قابل پرداخت (به حروف): ........................................................</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <script>
            window.addEventListener('load', function () {
              window.focus()
              window.print()
              window.close()
            })
          <\/script>
        </body>
        </html>`

      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
    },
  },
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
    <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">صورت حساب فروش کالا</h2>
        <button
          type="button"
          class="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300"
          @click="closeModal"
        >
          ×
        </button>
      </div>

      <div v-if="error" class="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">
        {{ error }}
      </div>

      <div v-if="loading" class="py-10 text-center text-gray-500">
        در حال بارگذاری اطلاعات...
      </div>

      <div v-else class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">تاریخ فاکتور</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.invoice_date"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">شماره فاکتور</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.invoice_number"
            />
          </div>
          <div class="md:col-span-2 border-t pt-4">
            <h3 class="text-md font-semibold mb-3">اطلاعات مشتری</h3>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">نام مشتری</label>
            <select
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.customer_name"
            >
              <option value="" disabled>انتخاب مشتری</option>
              <option v-for="option in customerOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">کد ملی</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.customer_national_id"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">شماره ثبت</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.customer_register_number"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">کد اقتصادی</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.customer_commercial_code"
            />
          </div>
          <div class="md:col-span-2 flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">آدرس</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.customer_address"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">کد پستی</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.customer_postal_code"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">تلفن</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.customer_phone"
            />
          </div>
          <div class="md:col-span-2 border-t pt-4">
            <h3 class="text-md font-semibold mb-3">اطلاعات کالا</h3>
          </div>
          <div class="md:col-span-2 flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">توضیحات کالا</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.product_description"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">وزن خالص</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.net_weight"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">واحد</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.unit"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">قیمت هر کیلوگرم</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.price_per_kg"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">قیمت کل</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.total_price"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">هزینه اضافی</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.extra_cost"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">قیمت پس از تخفیف</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.total_price_after_off"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">مالیات</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.tax"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">قیمت نهایی</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold"
              v-model="form.total_price_after_tax"
              disabled
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            @click="closeModal"
          >
            انصراف
          </button>
          <button
            type="button"
            class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            :disabled="submitting || loading"
            @click="handlePrint"
          >
            <span v-if="submitting">در حال آماده‌سازی...</span>
            <span v-else>چاپ فاکتور فروش</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
