import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import addTruck from "@/components/addTruck.vue";
import addSupplier from "@/components/addSupplier.vue";
import addCustomer from "@/components/addCustomer.vue";
import addRawMaterial from "@/components/addRawMaterial.vue";
import addNewReel from "@/components/addNewReel.vue";
import addNewPM2Reel from "@/components/addNewPM2Reel.vue";
import addNewPM3Reel from "@/components/addNewPM3Reel.vue";
import addNewPM4Reel from "@/components/addNewPM4Reel.vue";
import forkliftPanel from "@/components/forkliftPanel.vue";
import createShipment from "@/components/createShipment.vue";
import sales from "@/components/weightStation/sales.vue";
import purchase from "@/components/weightStation/purchase.vue";
import weight1 from "@/components/weightStation/weight1.vue";
import weight2 from "@/components/weightStation/weight2.vue";
import weightStationPanel from "@/components/weightStation/weightStationPanel.vue";
import addNewAnbar from "@/components/admin/addNewAnbar.vue";
import addNewUnit from "@/components/admin/addNewUnit.vue";
import addNewMatrialType from "@/components/admin/addNewMatrialType.vue";
import consumptionProfile from "@/components/admin/consumptionProfile.vue";
import cancel from "@/components/admin/cancel.vue";
import reportPage from "@/components/admin/reportPage.vue";
import chooseReport from "@/components/admin/chooseReport.vue";
import productsReport from "@/components/admin/reports/ProductsReport.vue";
import shipmentReport from "@/components/admin/reports/shipmentReport.vue";
import salesReport from "@/components/admin/reports/salesReport.vue";
import purchasesReport from "@/components/admin/reports/purchasesReport.vue";
import rawMaterialReport from "@/components/admin/reports/rawMaterialReport.vue";
import consumptionReport from "@/components/admin/reports/consumptionReport.vue";
import alertsReport from "@/components/admin/reports/alertsReport.vue";
import AllPages from "@/components/admin/AllPages.vue";
import Products from "@/components/admin/Products.vue";
import InvoicePage from "@/components/invoicePage.vue";

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  {
    path: '/myapp/addTruck/',
    name: 'addTruck',
    component: addTruck
  },
  {
    path: '/myapp/addSupplier/',
    name: 'addSupplier',
    component: addSupplier
  },
  {
    path: '/myapp/addCustomer/',
    name: 'addCustomer',
    component: addCustomer
  },
  {
    path: '/myapp/addRawMaterial/',
    name: 'addRawMaterial',
    component: addRawMaterial
  },
  {
    path: '/myapp/addNewReel/',
    name: 'addNewReel',
    component: addNewReel
  },
  {
    path: '/myapp/addNewPM2Reel/',
    name: 'addNewPM2Reel',
    component: addNewPM2Reel
  },
  {
    path: '/myapp/addNewPM3Reel/',
    name: 'addNewPM3Reel',
    component: addNewPM3Reel
  },
  {
    path: '/myapp/addNewPM4Reel/',
    name: 'addNewPM4Reel',
    component: addNewPM4Reel
  },
  {
    path: '/myapp/forkliftPanel/',
    name: 'forkliftPanel',
    component: forkliftPanel
  },
  {
    path: '/myapp/addShipment/',
    name: 'addShipment',
    component: createShipment
  },
  {
    path: '/myapp/createSalesOrder/',
    name: 'createSalesOrder',
    component: sales
  },
  {
    path: '/myapp/createPurchaseOrder/',
    name: 'createPurchaseOrder',
    component: purchase
  },
  {
    path: '/myapp/updateWeight1/',
    name: 'updateWeight1',
    component: weight1
  },
  {
    path: '/myapp/updateWeight2/',
    name: 'updateWeight2',
    component: weight2
  },
  {
    path: '/myapp/weightStationPanel/',
    name: 'weightStationPanel',
    component: weightStationPanel
  },
  {
    path: '/myapp/addNewAnbar/',
    name: 'addNewAnbar',
    component: addNewAnbar
  },
  {
    path: '/myapp/addUnit/',
    name: 'addNewUnit',
    component: addNewUnit
  },
  {
    path: '/myapp/addMaterialType/',
    name: 'addNewMatrialType',
    component: addNewMatrialType
  },
  {
    path: '/myapp/addConsumptionProfile/',
    name: 'addConsumptionProfile',
    component: consumptionProfile
  },
  {
    path: '/myapp/cancel/',
    name: 'cancel',
    component: cancel
  },
  {
    path: '/myapp/report/',
    name: 'report',
    component: reportPage
  },
  {
    path: '/myapp/chooseReport/',
    name: 'chooseReport',
    component: chooseReport
  },
  {
    path: '/myapp/productsReport/',
    name: 'productsReport',
    component: productsReport
  },
  {
    path: '/myapp/shipmentReport/',
    name: 'shipmentReport',
    component: shipmentReport
  },
  {
    path: '/myapp/salesReport/',
    name: 'salesReport',
    component: salesReport
  },
  {
    path: '/myapp/purchasesReport/',
    name: 'purchasesReport',
    component: purchasesReport
  },
  {
    path: '/myapp/rawMaterialReport/',
    name: 'rawMaterialReport',
    component: rawMaterialReport
  },
  {
    path: '/myapp/consumptionReport/',
    name: 'consumptionReport',
    component: consumptionReport
  },
  {
    path: '/myapp/alertsReport/',
    name: 'alertsReport',
    component: alertsReport
  },
  {
    path: '/myapp/',
    name: 'AllPages',
    component: AllPages
  },
  {
    path: '/myapp/ProductsPage/',
    name: 'Products',
    component: Products
  },
  {
    path: '/myapp/InvoicePage/',
    name: 'InvoicePage',
    component: InvoicePage
  },
]

const router = createRouter({
  // history: createWebHistory(process.env.BASE_URL),
  history: createWebHistory(),
  routes,
})

export default router
