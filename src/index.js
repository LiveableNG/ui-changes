import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import './index.css';
// import KYCForm from './PublishUnit';
// import HomeServiceApp from './Handiman/HomeServiceApp';
// import { PDFSignature } from 'pdf-lib';
// import UnitInspectionManagement from './Files/UnitInspectionManagement';
import LettingManagementTable from './Files/LettingManagement/LettingManagement';
import GoogleLikeFormBuilder from './GoogleLikeFormBuilder';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <FormBuilder /> */}
    {/* <CreditChekReportViewer /> */}
    {/* <PropertyReport /> */}
    {/* <LandlordReport1 /> */}
    {/* <GoogleLikeFormBuilder /> */}
    {/* <PDFSignature /> */}
    {/* <KYCForm /> */}
    {/* <HomeServiceApp /> */}
    {/* <PropertyInspection /> */}
    {/* <UnitInspectionManagement /> */}
    <LettingManagementTable />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
