<script>
import { initFlowbite } from 'flowbite'
import Card from './Card'
import Alert from "@/components/Alert.vue";
import modal from "@/components/Modal.vue";
import ModalButton from "@/components/custom/ModalButton.vue";
import Input from "@/components/custom/Input.vue";
import Dropdown from "@/components/custom/Dropdown.vue";

export default {
  name: "addNewReel",
  components: {
    Dropdown, Input,
    ModalButton,
    modal, Alert,
    Card
  },
  data(){
    return{
      forms: {
        reel_number:{type:'input', name: 'شماره رول', title:'شماره رول', data:'', value:'', lable:'number'},
        width:{type:'input', name: 'عرض', title:'عرض', data:'', value:'', lable:'number'},
        GSM:{type:'input', name: 'گرماژ', title:'گرماژ', data:'', value:'', lable:'number'},
        length:{type:'input', name: 'طول', title:'طول', data:'', value:'', lable:'number'},
        breaks:{type:'input', name: 'پارگی', title:'پارگی', data:'', value:'', lable:'number'},
        grade:{type:'radio', name: 'نوع', title:'نوع', data:'', value:'', lable:'text'},
        consumption_profile_name:{type:'dropdown', name:'پروفایل مصرف', title:'پروفایل مصرف', data:'', value:''},
        commnet: {type:'radio', name: 'توضیحات', title: 'توضیحات', value: '', lable:'comment'},
        username: {type:'input', name: 'نام کاربر', title: 'نام کاربر', value: '', lable:'text'},
      },
      gradeOptions: [
        'Test Linear Homayoun',
        'Kraft Linear Homayoun',
        'Whitetop Linear Homayoun',
        'Flutting Homayoun'
      ],
      selectedGradeOption: '',
      customGradeValue: '',
      commentOptions: [
        'عالی',
        'اختلاف ۲ گرم بالا/پایین تر',
        'اختلاف رطوبت بالا/پایین تر',
        'پارگی ۱',
        'پارگی ۲ یا بیشتر'
      ],
      selectedCommentOption: '',
      customCommentValue: '',
      success: false,
      error: false,
      warinig: {status: false, data: []},
      errors: [],
      qrcode: '',
      hide: false,
      loading: false,
    }
  },
  mounted() {
    initFlowbite();
    
    // Set default selections for radio buttons
    if (this.gradeOptions.length > 0) {
      this.selectedGradeOption = this.gradeOptions[0]  // Select "Test Linear Homayoun"
      this.forms.grade.value = this.gradeOptions[0]
    }
    if (this.commentOptions.length > 0) {
      this.selectedCommentOption = this.commentOptions[0]
      this.forms.commnet.value = this.commentOptions[0]
    }
    
    this.axios.get('/myapp/api/getReelNumber').then((response) => {

      this.forms.reel_number.value = response.data['next_reel_number']
      this.forms.width.value = response.data['width']
      this.forms.GSM.value = response.data['GSM']
      this.forms.length.value = response.data['length']
      this.forms.breaks.value = response.data['breaks']
    
      this.forms.consumption_profile_name.value = response.data['profile_name']
      this.forms.consumption_profile_name.name = this.forms.consumption_profile_name.name +': '+response.data['profile_name']

    })
    this.axios.get('/myapp/api/getConsumptionProfileNames').then((response) => {
      //
      this.forms.consumption_profile_name.data = response.data['profile_names']
    })
  },
  watch:{
    hide(c, p){
      if (c == true) {
        location.reload();
      }
    },
  },
  methods: {
    handleGradeSelection(option) {
      if (option === 'else') {
        this.selectedGradeOption = 'else';
        this.forms.grade.value = this.customGradeValue;
      } else {
        this.selectedGradeOption = option;
        this.forms.grade.value = option;
        this.customGradeValue = '';
      }
    },
    handleCustomGradeInput() {
      this.forms.grade.value = this.customGradeValue;
    },
    handleCommentSelection(option) {
      if (option === 'else') {
        this.selectedCommentOption = 'else';
        this.forms.commnet.value = this.customCommentValue;
      } else {
        this.selectedCommentOption = option;
        this.forms.commnet.value = option;
        this.customCommentValue = '';
      }
    },
    handleCustomCommentInput() {
      this.forms.commnet.value = this.customCommentValue;
    },
    clicked(k, name){
      //
      if (k == 'consumption_profile_name'){
        this.forms.consumption_profile_name.value = name
        this.forms.consumption_profile_name.name = name
      }
    },
    formatNumber(value) {
      return value.replace(/\D/g, "");
    },
    async addNewReel() {
      this.loading = true
      let params = {
        "reel_number": 'PM4_' + this.forms.reel_number.value, 
        "width": this.forms.width.value,
        "gsm": this.forms.GSM.value,
        "length": this.forms.length.value,
        "breaks": this.forms.breaks.value,
        "grade": this.forms.grade.value,
        "commnet": this.forms.commnet.value,
        "consumption_profile_name": this.forms.consumption_profile_name.value,
        "username": this.forms.username.value,
      };
      let params_QR = `Reel Number: ${params['reel_number']},\nWidth: ${params['width']},\nGSM: ${params['gsm']},\nLength:~ ${params['length']},\nBreaks: ${params['breaks']},\nGrade: ${params['grade']}` // ,\nComment: ${params['commnet']},\nConsumption Profile Name: ${params['consumption_profile_name']},\nUsername: ${params['username']}`
      const response = await this.axios.post('/myapp/api/generateQrCode', {}, {params: {'data':JSON.stringify(params), 'd':params_QR}})
      //
      let filename = response.data.filename
      let file = response.data.file
      this.qrcode = `data:image/png;base64,${file}`;
      //
      // this.qrcode = await QRCode.toDataURL(JSON.stringify(params), {
      //   width: 256,
      //   height: 256,
      // })
      params['qr_code']=filename
      //
      this.errors = []
      for (const key in this.forms) {
        //
        if ((this.forms[key].value == '')){
          if (key!='commnet'){
            if ((this.forms[key].value !== 0)){
              this.forms[key].error = true
              this.loading=false
              this.errors.push({'message': `${this.forms[key].name} مورد نیاز است`})
            }
          }
        }else {
           this.forms[key].error = false
          if (key == 'breaks'){
            let breaks = parseInt(this.forms.breaks.value.toString().replace(/,/g, ''))
            //
            if ((breaks <= -1) || (breaks >=21)){
                this.error = true
                this.errors.push({'message': 'مقدار پارگی باید بین 0 تا 20 باشد'})
                this.loading=false
            }
          }
        }
      }
      if (this.errors.length == 0){
        this.error = false

        const response = await this.axios.post('/myapp/addNewPM4Reel/', {}, {params: params})

        if (response.data['status'] == 'success'){
          this.success = true
          this.loading=false
          if (response.data['warning'].length != 0){
            this.warinig.status = true
            this.warinig.data = response.data['warning']
          }
        }else {
          this.loading=false
          this.error = true
          this.errors = response.data['errors']
        }
      } else {
        this.error = true
      }
    },
    async printQRCode() {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>چاپ QR-code</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; }
              .qr-container { text-align: center; }
              .reel-number { font-size: 64px; font-weight: bold; margin: 10px 0; }
              .label { font-size: 32px; font-weight: bold; margin: 10px 0; }
              .details { font-size: 24px; margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${this.qrcode}" style="max-width: 330px;" />
              <div class="reel-number">${'PM4_' + this.forms.reel_number.value}</div>
              <div class="label">H O M A Y O U N</div>
              <div class="details">${this.forms.grade.value}</div>
              <div class="details">${this.forms.width.value} cm - ${this.forms.GSM.value} gr</div>
              <!-- <div class="details">${this.forms.GSM.value} gr</div> -->
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      location.reload();
    },
  },
}
</script>
<template>
  <Card title="PM4 - اضافه کردن رول جدید">
    <form class="flex flex-col items-center mt-5 gap-4">
      <div v-if="error" class="flex p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        <svg class="flex-shrink-0 inline w-4 h-4 me-3 mt-[2px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
        </svg>
        <span class="sr-only">Danger</span>
        <div>
          <span class="font-medium">خطا! لطفا اطلاعات را برسی کنید:</span>
            <ul class="mt-1.5 list-disc list-inside">
              <li v-for="error in errors">{{ error.message }}</li>
          </ul>
        </div>
      </div>
      <div v-if="success" class="flex p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
        <svg class="flex-shrink-0 inline w-4 h-4 me-3 mt-[2px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
        </svg>
        <div>
          <span class="font-medium">
             با موفقیت به سیستم اضافه شد.
            <template v-for="(val, key) in forms">
                <p v-if="key=='reel_numbers'">شماره رول:</p>
                <ul v-if="key=='reel_numbers'">
                  <li v-for="item in val.value" :key="item">{{ item }}</li>
                </ul>
                <p v-else>{{val.title}}: {{val.value}}</p>
            </template>
          </span>
        </div>
      </div>
      <template v-for="(val, form_name) in forms">
        <!-- Radio buttons for grade field -->
        <template v-if="val.type=='radio' && form_name=='grade'">
          <div class="w-full max-w-md">
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ val.name }}
            </label>
            <div class="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600">
              <!-- Predefined radio options -->
              <div v-for="option in gradeOptions" :key="option" class="flex items-center">
                <input 
                  :id="`grade-${option}`"
                  type="radio" 
                  :value="option"
                  v-model="selectedGradeOption"
                  @change="handleGradeSelection(option)"
                  class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label 
                  :for="`grade-${option}`"
                  class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                >
                  {{ option }}
                </label>
              </div>
              
              <!-- "Else" radio option with custom input -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center">
                  <input 
                    id="grade-else"
                    type="radio" 
                    value="else"
                    v-model="selectedGradeOption"
                    @change="handleGradeSelection('else')"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label 
                    for="grade-else"
                    class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                  >
                    غیره (دیگر)
                  </label>
                </div>
                
                <!-- Custom input shown when "else" is selected -->
                <div v-if="selectedGradeOption === 'else'" class="mr-6">
                  <input 
                    v-model="customGradeValue"
                    @input="handleCustomGradeInput"
                    type="text"
                    class="block w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="نوع دلخواه را وارد کنید"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Radio buttons for commnet field -->
        <template v-else-if="val.type=='radio' && form_name=='commnet'">
          <div class="w-full max-w-md">
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ val.name }}
            </label>
            <div class="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600">
              <!-- Predefined radio options -->
              <div v-for="option in commentOptions" :key="option" class="flex items-center">
                <input 
                  :id="`comment-${option}`"
                  type="radio" 
                  :value="option"
                  v-model="selectedCommentOption"
                  @change="handleCommentSelection(option)"
                  class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label 
                  :for="`comment-${option}`"
                  class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                >
                  {{ option }}
                </label>
              </div>
              
              <!-- "سایر" radio option with custom input -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center">
                  <input 
                    id="comment-else"
                    type="radio" 
                    value="else"
                    v-model="selectedCommentOption"
                    @change="handleCommentSelection('else')"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label 
                    for="comment-else"
                    class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                  >
                    سایر
                  </label>
                </div>
                
                <!-- Custom input shown when "سایر" is selected -->
                <div v-if="selectedCommentOption === 'else'" class="mr-6">
                  <input 
                    v-model="customCommentValue"
                    @input="handleCustomCommentInput"
                    type="text"
                    class="block w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="توضیحات دلخواه را وارد کنید"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Regular input fields -->
        <template v-else-if="val.type=='input'">
            <Input
              :formName="form_name"
              :label="val.name"
              :type="val.lable"
              :disabled="val.disabled"
              @update="val.value = $event"
              :value="val.value"
            />
        </template>
        
        <!-- Dropdown fields -->
        <template v-else-if="val.type=='dropdown'">
          <Dropdown :formName="form_name">
            <template v-slot:btnName>
              {{val.name}}
            </template>
            <template v-slot:list>
              <li v-for="(data, index) in val.data" :key="index">
                <a @click="clicked(form_name, data)" type="button" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                  {{ data }}
                </a>
              </li>
            </template>
          </Dropdown>
        </template>
      </template>
      <modal type="confirm" :disabled="loading">
        <template v-slot:button>
          <template v-if="loading">
            <button disabled type="button" :class="[loading ? '' : 'hidden']" class="inline-flex justify-center items-center">
                <svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                </svg>
                لطفا صبر کنید ...
            </button>
          </template>
          <template v-else>اضافه کردن</template>
        </template>
        <template v-slot:text>
          <div class="flex flex-col gap-2 font-bold">
            <template v-for="(val, key) in forms">
                <p v-if="key=='reel_numbers'">شماره رول:</p>
                <ul v-if="key=='reel_numbers'">
                  <li v-for="item in val.value" :key="item">{{ item }}</li>
                </ul>
                <p v-else>{{val.title}}: {{val.value}}</p>
            </template>
          </div>
        </template>
        <template v-slot:btns>
          <div>
            <ModalButton @close="addNewReel" />
          </div>
        </template>
      </modal>

      <div v-if="success" :class="{'hidden': hide}" class="backdrop-blur-sm bg-white/30 flex fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative p-4 w-full max-w-md max-h-full">
          <div  id="alert-3" class="flex flex-col gap-4 p-4 mb-4 text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
              <header class="flex felx-row justify-between items-center">
                <svg class="flex-shrink-0 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
              </svg>
                <h class="ms-3 text-sm font-medium">رول  {{ forms.reel_number.value }} با موفقیت به سیستم اضافه شد.</h>
                <button @click="hide=!hide" type="button" class="ms-auto -mx-1.5 -my-1.5 bg-green-50 text-green-500 rounded-lg focus:ring-2 focus:ring-green-400 p-1.5 hover:bg-green-200 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-700">
                <span class="sr-only">Close</span>
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
              </button>
              </header>
              <main class="flex flex-col justify-center items-center gap-2">
                <div v-if="warinig.status == true" class="flex flex-col p-4 mb-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800" role="alert">
                  <header class="flex flex-row">
                    <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                    </svg>
                    <span class="sr-only">Info</span>
                    <span class="font-bold">هشدار!</span>
                  </header>
                  <main>
                    <ul class="mt-1.5 list-disc list-inside">
                        <li v-for="w in warinig.data"> {{ w['message'] }}</li>
                    </ul>
                  </main>
                </div>

                <img :src="qrcode" class="w-[256px] h-[256px]"/>
                <button @click="printQRCode" type="button" class="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">چاپ QR Code</button>

              </main>
            </div>
        </div>
      </div>
    </form>
  </Card>
</template>
