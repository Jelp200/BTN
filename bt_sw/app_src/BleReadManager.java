package com.veepoo.hband.ble;

import android.content.Context;
import android.content.Intent;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import com.orhanobut.logger.Logger;
import com.veepoo.hband.HBandApplication;
import com.veepoo.hband.R2;
import com.veepoo.hband.activity.MainActivity;
import com.veepoo.hband.activity.callback.OnBleWriteCallback;
import com.veepoo.hband.activity.callback.OnReadFinishCallBack;
import com.veepoo.hband.ble.readmanager.AIFunctionHandler;
import com.veepoo.hband.ble.readmanager.AlarmHandler;
import com.veepoo.hband.ble.readmanager.AlarmRangeHandler;
import com.veepoo.hband.ble.readmanager.AllSettingHanlder;
import com.veepoo.hband.ble.readmanager.BPSettingHandler;
import com.veepoo.hband.ble.readmanager.BatterManagerHandler;
import com.veepoo.hband.ble.readmanager.BatteryHandler;
import com.veepoo.hband.ble.readmanager.BatteryReadManager;
import com.veepoo.hband.ble.readmanager.BigDataHandler;
import com.veepoo.hband.ble.readmanager.BloodCompositionHandler;
import com.veepoo.hband.ble.readmanager.BloodGlucoseHandler;
import com.veepoo.hband.ble.readmanager.BodyComponentHandler;
import com.veepoo.hband.ble.readmanager.BodyComponentReadManager;
import com.veepoo.hband.ble.readmanager.DeviceFunctionHandler;
import com.veepoo.hband.ble.readmanager.DeviceHandler;
import com.veepoo.hband.ble.readmanager.DrinkHandler;
import com.veepoo.hband.ble.readmanager.EcgDeviceManager;
import com.veepoo.hband.ble.readmanager.HRVHandler;
import com.veepoo.hband.ble.readmanager.HeartWarningHandler;
import com.veepoo.hband.ble.readmanager.KDeviceBTHandler;
import com.veepoo.hband.ble.readmanager.LongseatHanlder;
import com.veepoo.hband.ble.readmanager.ManualMeasurementHandler;
import com.veepoo.hband.ble.readmanager.ManualMeasurementReadManager;
import com.veepoo.hband.ble.readmanager.MultiAlarmHandler;
import com.veepoo.hband.ble.readmanager.NightTurnWristHandler;
import com.veepoo.hband.ble.readmanager.OriginalDFHander;
import com.veepoo.hband.ble.readmanager.OriginalHander;
import com.veepoo.hband.ble.readmanager.PersonHandle;
import com.veepoo.hband.ble.readmanager.PhotoAlbumHandler;
import com.veepoo.hband.ble.readmanager.QuickQRCodeHandler;
import com.veepoo.hband.ble.readmanager.ScreenLightHanlder;
import com.veepoo.hband.ble.readmanager.ScrenLightTimeHandler;
import com.veepoo.hband.ble.readmanager.SleepHandler;
import com.veepoo.hband.ble.readmanager.Spo2hOriginalHander;
import com.veepoo.hband.ble.readmanager.SportModelHander;
import com.veepoo.hband.ble.readmanager.TemptureOriginalHander;
import com.veepoo.hband.ble.readmanager.TextAlarmHandler;
import com.veepoo.hband.ble.readmanager.WeatherHandler;
import com.veepoo.hband.ble.readmanager.WomenHandler;
import com.veepoo.hband.config.SputilVari;
import com.veepoo.hband.handler.ContactHandler;
import com.veepoo.hband.handler.GpsDataOprate;
import com.veepoo.hband.modle.AllSettingBean;
import com.veepoo.hband.modle.BindDataBean;
import com.veepoo.hband.modle.EAlarmRangeType;
import com.veepoo.hband.modle.WomenBean;
import com.veepoo.hband.sql.SqlHelperUtil;
import com.veepoo.hband.util.AppSPUtil;
import com.veepoo.hband.util.BaseUtil;
import com.veepoo.hband.util.BleInfoUtil;
import com.veepoo.hband.util.ConvertHelper;
import com.veepoo.hband.util.SpUtil;
import com.veepoo.hband.util.ToastUtils;
import com.veepoo.hband.util.log.HBLogger;
import java.util.Timer;
import java.util.TimerTask;

/* loaded from: classes3.dex */
public class BleReadManager implements BleProfile {
    private static final String TAG = "BleReadManager";
    EcgDeviceManager ecgManager;
    BigDataHandler mBigDataHandler;
    BindDataBean mBindDataBean;
    OnBleWriteCallback mBleWriterCall;
    Context mContext;
    DrinkHandler mDrinkHandler;
    GpsDataOprate mGpsDataOprate;
    HRVHandler mHRVHandler;
    LowPowerHandler mLowPowerHandler;
    OriginalDFHander mOriginalDFHandler;
    OriginalHander mOriginalHandler;
    SleepHandler mSleepHandler;
    Spo2hOriginalHander mSpo2hOriginHandler;
    SportModelHander mSportModelHandler;
    TemptureOriginalHander mTemptureOriginalHander;
    MultiAlarmHandler multiAlarmHandler;
    OnReadFinishCallBack onReadFinishCallBack;
    Timer timerReading;
    Timer timerSetting;
    boolean isReadSettingWatch = false;
    boolean isManageReadSportModel = false;

    public BleReadManager(Context context) {
        this.mContext = context;
    }

    public void setEcgManager(EcgDeviceManager ecgDeviceManager) {
        this.ecgManager = ecgDeviceManager;
    }

    public void setUserData(BindDataBean bindDataBean) {
        this.mBindDataBean = bindDataBean;
        updateBindData(bindDataBean);
    }

    private void updateBindData(BindDataBean bindDataBean) {
        SleepHandler sleepHandler = this.mSleepHandler;
        if (sleepHandler != null) {
            sleepHandler.setBindDataBean(bindDataBean);
        }
        OriginalHander originalHander = this.mOriginalHandler;
        if (originalHander != null) {
            originalHander.setBindDataBean(bindDataBean);
        }
        OriginalDFHander originalDFHander = this.mOriginalDFHandler;
        if (originalDFHander != null) {
            originalDFHander.setBindDataBean(bindDataBean);
        }
        DrinkHandler drinkHandler = this.mDrinkHandler;
        if (drinkHandler != null) {
            drinkHandler.setBindDataBean(bindDataBean);
        }
        Spo2hOriginalHander spo2hOriginalHander = this.mSpo2hOriginHandler;
        if (spo2hOriginalHander != null) {
            spo2hOriginalHander.setBindDataBean(bindDataBean);
        }
        TemptureOriginalHander temptureOriginalHander = this.mTemptureOriginalHander;
        if (temptureOriginalHander != null) {
            temptureOriginalHander.setBindDataBean(bindDataBean);
        }
        SportModelHander sportModelHander = this.mSportModelHandler;
        if (sportModelHander != null) {
            sportModelHander.setBindDataBean(bindDataBean);
        }
        HRVHandler hRVHandler = this.mHRVHandler;
        if (hRVHandler != null) {
            hRVHandler.setBindDataBean(bindDataBean);
        }
        EcgDeviceManager ecgDeviceManager = this.ecgManager;
        if (ecgDeviceManager != null) {
            ecgDeviceManager.setBindDataBean(bindDataBean);
        }
        BodyComponentReadManager.INSTANCE.getInstance().setBindDataBean(bindDataBean);
        ManualMeasurementReadManager.getInstance().setBindDataBean(bindDataBean);
    }

    public static void setCheckPwdPassFlag(boolean z) {
        SpUtil.saveBoolean(HBandApplication.mContext, SputilVari.IS_PWD_CHECK_PASS, z);
    }

    public static boolean getCheckPwdPassFlag() {
        return SpUtil.getBoolean(HBandApplication.mContext, SputilVari.IS_PWD_CHECK_PASS, false);
    }

    public void readSetting() {
        Timer timer;
        Timer timer2 = this.timerSetting;
        try {
            if (timer2 != null) {
                try {
                    timer2.cancel();
                    this.timerSetting = null;
                    timer = new Timer();
                } catch (RuntimeException e) {
                    e.printStackTrace();
                    timer = new Timer();
                }
                this.timerSetting = timer;
            }
            this.timerSetting.schedule(new ReadSportTask(), 100L);
            this.timerSetting.schedule(new SettingHidTask(), 150L);
            if (BleInfoUtil.isDeviceNumberReverse(BleInfoUtil.getDeviceNumber(this.mContext))) {
                this.timerSetting.schedule(new ReadDeviceNumberTask(), 200L);
            }
            this.timerSetting.schedule(new SettingLanguageTask(), 250L);
            this.timerSetting.schedule(new ReadBatteryTask(), 300L);
            this.timerSetting.schedule(new SettingPersonInfoTask(), 400L);
            this.timerSetting.schedule(new ReadLongSeatTask(), 450L);
            this.timerSetting.schedule(new ReadHeartWaringTask(), 500L);
            this.timerSetting.schedule(new ReadNightTurnTask(), 550L);
            this.timerSetting.schedule(new ReadBpTask(), 600L);
            this.timerSetting.schedule(new SettingWomenTask(), 650L);
            this.timerSetting.schedule(new ReadSpo2hNightMonitorTask(), 700L);
            this.timerSetting.schedule(new ReadScreenLight(), 750L);
            this.timerSetting.schedule(new ReadWeatherTask(), 800L);
            this.timerSetting.schedule(new ReadScreenLightTimeTask(), 850L);
            this.timerSetting.schedule(new ReadBatteryManagerInfoTask(), 900L);
            this.timerSetting.schedule(new ReadAlarmTask(), 950L);
            this.timerSetting.schedule(new ReadContact(), 1350L);
            if (SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_BLOOD_GLUCOSE_ADJUSTING, false)) {
                this.timerSetting.schedule(new ReadBloodGlucoseAdjustingTask(), 1100L);
            }
            if (SpUtil.getBoolean(this.mContext, SputilVari.LOW_BATTER_FUNCTION, false)) {
                this.timerSetting.schedule(new ReadLowPowerTask(), 1150L);
            }
            if (AppSPUtil.isHaveTemperatureAlarm()) {
                this.timerSetting.schedule(new ReadTemperatureAlarmTask(), 1200L);
            }
            int i = SpUtil.getInt(this.mContext, SputilVari.FUCTION_BIG_DATA_TRAN_TYPE, 0);
            int i2 = SpUtil.getInt(this.mContext, SputilVari.IS_HAVE_UI_CUSTOM, 0);
            if (i > 1 && i2 > 0) {
                this.timerSetting.schedule(new ReadCustomUiConfigTask(), 1250L);
            }
            int i3 = SpUtil.getInt(this.mContext, SputilVari.IS_HAVE_UI_SERVER, 0);
            if (i > 1 && i3 > 0) {
                this.timerSetting.schedule(new ReadServerUiConfigTask(), 1300L);
            }
            if (AppSPUtil.isHaveBloodCompositionFunction()) {
                this.timerSetting.schedule(new ReadBloodCompositionAdjustingTask(), 1400L);
            }
            boolean zIsHaveAIQAFunction = AppSPUtil.isHaveAIQAFunction();
            boolean zIsHaveAIDialFunction = AppSPUtil.isHaveAIDialFunction();
            if (zIsHaveAIQAFunction || zIsHaveAIDialFunction) {
                this.timerSetting.schedule(new ReadAIConfigTask(), 2000L);
            }
        } finally {
            this.timerSetting = new Timer();
        }
    }

    public void readFinishWithWriteFailed(String str) {
        String str2 = TAG;
        Logger.t(str2).e(str, new Object[0]);
        MainActivity.isReadTenMinuteData = false;
        LocalBroadcastManager.getInstance(this.mContext).sendBroadcast(new Intent(BleBroadCast.READ_DEVICE_DATA_FINISH));
        Logger.t(str2).e("结束读取-----------------》" + str, new Object[0]);
    }

    public void readData() {
        Timer timer;
        if (SpUtil.getInt(this.mContext, SputilVari.ECG_FUNCTION_TYPE, 0) == 7) {
            ToastUtils.showDebug("ecg类型07，不支持读取数据");
            return;
        }
        MainActivity.isReadTenMinuteData = true;
        if (BleChipPlatform.isBluetrum()) {
            Logger.t(TAG).i("管理-->中科平台开始读取数据", new Object[0]);
        } else {
            Logger.t(TAG).i("管理-->开始读取10分钟数据", new Object[0]);
        }
        readSport();
        Timer timer2 = this.timerReading;
        if (timer2 != null) {
            try {
                try {
                    timer2.cancel();
                    this.timerReading = null;
                    timer = new Timer();
                } catch (RuntimeException e) {
                    e.printStackTrace();
                    timer = new Timer();
                }
                this.timerReading = timer;
            } finally {
                this.timerReading = new Timer();
            }
        }
        this.onReadFinishCallBack = null;
        StringBuilder sb = new StringBuilder();
        String str = TAG;
        sb.append(str);
        sb.append("--动画");
        Logger.t(sb.toString()).e("-BleBroadCast.READ_DEVICE_DATA_START- 10分钟读取模块 = true", new Object[0]);
        LocalBroadcastManager.getInstance(this.mContext).sendBroadcast(new Intent(BleBroadCast.READ_DEVICE_DATA_START));
        Logger.t(str).e("管理-->读取睡眠数据", new Object[0]);
        this.onReadFinishCallBack = new OnReadFinishCallBack() { // from class: com.veepoo.hband.ble.BleReadManager.1
            @Override // com.veepoo.hband.activity.callback.OnReadFinishCallBack
            public void readFinish(OnReadFinishCallBack.Oprate oprate) {
                Logger.t(BleReadManager.TAG).e("管理-->finish-->" + oprate, new Object[0]);
                switch (AnonymousClass6.$SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[oprate.ordinal()]) {
                    case 1:
                        Logger.t(BleReadManager.TAG).e("管理-->读取睡眠数据结束->读取原始数据", new Object[0]);
                        HBLogger.bleChangeLog("【十分钟读取】#读取睡眠结束#->开始读取【原始数据】");
                        BleReadManager.this.readOriginal();
                        break;
                    case 2:
                        Logger.t(BleReadManager.TAG).e("管理-->读取原始数据结束->读取饮酒数据", new Object[0]);
                        BleReadManager.this.readNextDrink();
                        break;
                    case 3:
                        Logger.t(BleReadManager.TAG).e("管理-->读取饮酒数据结束->读取血氧数据", new Object[0]);
                        BleReadManager.this.readNextSpo2h();
                        break;
                    case 4:
                        Logger.t(BleReadManager.TAG).e("管理-->读取血氧数据结束->读取运动模式数据", new Object[0]);
                        BleReadManager.this.readNextSportModel();
                        break;
                    case 5:
                        if (BleReadManager.this.isManageReadSportModel) {
                            BleReadManager.this.isManageReadSportModel = false;
                        }
                        Logger.t(BleReadManager.TAG).e("管理-->读取运动模式数据结束->读取HRV数据", new Object[0]);
                        BleReadManager.this.readNextHRV();
                        break;
                    case 6:
                        Logger.t(BleReadManager.TAG).e("管理-->读取HRV数据结束->读取ECG数据", new Object[0]);
                        BleReadManager.this.readNextECGManually();
                        break;
                    case 7:
                        BleReadManager.this.ecgManager.setAfterTen(false);
                        Logger.t(BleReadManager.TAG).e("管理-->ECG结束", new Object[0]);
                        LocalBroadcastManager.getInstance(BleReadManager.this.mContext).sendBroadcast(new Intent(BleBroadCast.ORIGINAL_ECG_AUTO));
                        BleReadManager.this.readBodyComponent();
                        break;
                    case 8:
                        Logger.t(BleReadManager.TAG).e("管理-->读取身体成分结束", new Object[0]);
                        LocalBroadcastManager.getInstance(BleReadManager.this.mContext).sendBroadcast(new Intent(BleBroadCast.ORIGINAL_BODY_COMPONENT));
                        BleReadManager.this.readNextTemptureOrigin();
                        break;
                    case 9:
                        Logger.t(BleReadManager.TAG).e("管理-->读取身体成分结束", new Object[0]);
                        HBLogger.bleChangeLog("【十分钟读取】[读取体温数据结束】>读取自动测量数据数据");
                        LocalBroadcastManager.getInstance(BleReadManager.this.mContext).sendBroadcast(new Intent(BleBroadCast.ORIGINAL_DATE_UPDATE));
                        BleReadManager.this.readManualMeasurement();
                        break;
                    case 10:
                        Logger.t(BleReadManager.TAG).e("管理-->读取自动测量结束", new Object[0]);
                        BleReadManager.this.finishReadData("管理-->读取自动测量结束");
                        HBLogger.bleChangeLog("【十分钟读取】[读取自动测量结束】->【数据全部读取完成】");
                        LocalBroadcastManager.getInstance(BleReadManager.this.mContext).sendBroadcast(new Intent(BleBroadCast.ORIGINAL_MANUAL_MEASUREMENT));
                        LocalBroadcastManager.getInstance(BleReadManager.this.mContext).sendBroadcast(new Intent(BleBroadCast.ORIGINAL_DATE_UPDATE));
                        BleReadManager.this.readGpsCRC();
                        break;
                    case 11:
                        Logger.t(BleReadManager.TAG).e("管理-->读取完GPS数据", new Object[0]);
                        break;
                }
            }
        };
        this.timerReading.schedule(new ReadSleepTask(), 200L);
    }

    /* renamed from: com.veepoo.hband.ble.BleReadManager$6, reason: invalid class name */
    static /* synthetic */ class AnonymousClass6 {
        static final /* synthetic */ int[] $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate;

        static {
            int[] iArr = new int[OnReadFinishCallBack.Oprate.values().length];
            $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate = iArr;
            try {
                iArr[OnReadFinishCallBack.Oprate.SLEEP.ordinal()] = 1;
            } catch (NoSuchFieldError unused) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.ORIGINAL.ordinal()] = 2;
            } catch (NoSuchFieldError unused2) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.DRINK.ordinal()] = 3;
            } catch (NoSuchFieldError unused3) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.SPO2H_ORIGINAL.ordinal()] = 4;
            } catch (NoSuchFieldError unused4) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.SPORT_MODEL.ordinal()] = 5;
            } catch (NoSuchFieldError unused5) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.HRV.ordinal()] = 6;
            } catch (NoSuchFieldError unused6) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.ECG_AUTO.ordinal()] = 7;
            } catch (NoSuchFieldError unused7) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.BODY_COMPONENT.ordinal()] = 8;
            } catch (NoSuchFieldError unused8) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.TEMPTURE_ORIGINAL.ordinal()] = 9;
            } catch (NoSuchFieldError unused9) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.MANUAL_MEASUREMENT.ordinal()] = 10;
            } catch (NoSuchFieldError unused10) {
            }
            try {
                $SwitchMap$com$veepoo$hband$activity$callback$OnReadFinishCallBack$Oprate[OnReadFinishCallBack.Oprate.GPS_DATA.ordinal()] = 11;
            } catch (NoSuchFieldError unused11) {
            }
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readDeviceNumber() {
        new DeviceHandler(this.mContext).readDevicenumber();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void settingLanguage() {
        new BatteryHandler(this.mContext).settingLanguage();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readBattery() {
        new BatteryHandler(this.mContext).readBattery();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void settingWomen() {
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_HAVE_WOMEN, false);
        WomenBean women = SqlHelperUtil.getInstance().getWomen();
        WomenHandler womenHandler = new WomenHandler(this.mContext);
        if (women != null) {
            int i = SpUtil.getInt(this.mContext, getNotifyMacString(), -1);
            if (i == 1) {
                womenHandler.settingWomenStatus(women);
            } else if (i == 0) {
                women.setWomenstatus(0);
                womenHandler.settingWomenStatus(women);
            }
        } else {
            WomenBean womenBean = new WomenBean();
            womenBean.setWomenstatus(0);
            womenHandler.settingWomenStatus(womenBean);
            SpUtil.saveInt(this.mContext, getNotifyMacString(), 0);
        }
        if (z) {
            return;
        }
        WomenBean womenBean2 = new WomenBean();
        womenBean2.setWomenstatus(0);
        womenHandler.settingWomenStatus(womenBean2);
        SpUtil.saveInt(this.mContext, getNotifyMacString(), 0);
    }

    private String getNotifyMacString() {
        return "notify_" + SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS_WONMENDETAIL, "");
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void settingPersonInfo() {
        new PersonHandle(this.mContext).setPerson();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readLongSeat() {
        getLongseatHanlder().readLongSeat();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readBPSetting() {
        getBpSettingHandler().readSetting();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readAlarm() {
        if (SpUtil.getBoolean(this.mContext, SputilVari.MULTI_ALARM, false)) {
            MultiAlarmHandler multiAlarmHandler = new MultiAlarmHandler(this.mContext);
            this.multiAlarmHandler = multiAlarmHandler;
            multiAlarmHandler.readingAlarm();
            return;
        }
        new AlarmHandler(this.mContext).readingAlarm();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readLowPower() {
        if (this.mLowPowerHandler == null) {
            this.mLowPowerHandler = new LowPowerHandler(this.mContext);
        }
        this.mLowPowerHandler.readLowPower();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readUiServerConfig() {
        if (this.mBigDataHandler == null) {
            this.mBigDataHandler = new BigDataHandler(this.mContext);
        }
        this.mBigDataHandler.readBigTranBaseInfoServer();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readUiCustomConfig() {
        if (this.mBigDataHandler == null) {
            this.mBigDataHandler = new BigDataHandler(this.mContext);
        }
        this.mBigDataHandler.readBigTranBaseInfoCustom();
        String str = TAG;
        Logger.t(str).e("读取表盘信息: >>>>>> 是否有视频表盘 = " + AppSPUtil.isHaveVideoDial(), new Object[0]);
        Logger.t(str).e("读取表盘信息: >>>>>> 是否有相册功能 = " + AppSPUtil.isHavePhotoAlbumFunction(), new Object[0]);
        if (AppSPUtil.isHaveVideoDial() && AppSPUtil.isHavePhotoAlbumFunction()) {
            Logger.t(str).e("有视频表盘开始读取视频表盘的信息: >>>>>>", new Object[0]);
            HBandApplication.instance.uiHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BleReadManager.2
                @Override // java.lang.Runnable
                public void run() {
                    BleReadManager.this.mBigDataHandler.readBigTranBaseInfoVideo();
                }
            }, 100L);
            Logger.t(str).e("有相册功能开始读取相册的信息: >>>>>>", new Object[0]);
            HBandApplication.instance.uiHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BleReadManager.3
                @Override // java.lang.Runnable
                public void run() {
                    PhotoAlbumHandler.INSTANCE.getInstance().readPhotoAlbumInfo();
                }
            }, 200L);
            return;
        }
        if (AppSPUtil.isHaveVideoDial()) {
            Logger.t(str).e("有视频表盘开始读取视频表盘的信息: >>>>>>", new Object[0]);
            HBandApplication.instance.uiHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BleReadManager.4
                @Override // java.lang.Runnable
                public void run() {
                    BleReadManager.this.mBigDataHandler.readBigTranBaseInfoVideo();
                }
            }, 100L);
        } else if (AppSPUtil.isHavePhotoAlbumFunction()) {
            Logger.t(str).e("有相册功能开始读取相册的信息: >>>>>>", new Object[0]);
            HBandApplication.instance.uiHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BleReadManager.5
                @Override // java.lang.Runnable
                public void run() {
                    PhotoAlbumHandler.INSTANCE.getInstance().readPhotoAlbumInfo();
                }
            }, 100L);
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readScreenLight() {
        new ScreenLightHanlder(this.mContext).readScreenLight();
    }

    private void readSportModel() {
        if (this.mSportModelHandler == null) {
            SportModelHander sportModelHander = new SportModelHander(this.mContext);
            this.mSportModelHandler = sportModelHander;
            sportModelHander.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
        }
        this.isManageReadSportModel = true;
        this.mSportModelHandler.readSportModelCrc();
    }

    private void readSpo2hOrigin() {
        if (this.mSpo2hOriginHandler == null) {
            Spo2hOriginalHander spo2hOriginalHander = new Spo2hOriginalHander(this.mContext);
            this.mSpo2hOriginHandler = spo2hOriginalHander;
            spo2hOriginalHander.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
        }
        this.mSpo2hOriginHandler.readSpo2hOriginalFirst();
    }

    private void readTemptureOrigin() {
        if (this.mTemptureOriginalHander == null) {
            TemptureOriginalHander temptureOriginalHander = new TemptureOriginalHander(this.mContext);
            this.mTemptureOriginalHander = temptureOriginalHander;
            temptureOriginalHander.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
        }
        this.mTemptureOriginalHander.readTemptureFirst();
    }

    private void readHRV() {
        if (this.mHRVHandler == null) {
            HRVHandler hRVHandler = new HRVHandler(this.mContext);
            this.mHRVHandler = hRVHandler;
            hRVHandler.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
        }
        this.mHRVHandler.readOriginalFirst();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readGpsCRC() {
        if (this.mGpsDataOprate == null) {
            GpsDataOprate gpsDataOprate = new GpsDataOprate(this.mContext);
            this.mGpsDataOprate = gpsDataOprate;
            gpsDataOprate.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readOriginal() {
        double floatValue = SqlHelperUtil.getUserbean(this.mContext) != null ? BaseUtil.getFloatValue(r0.getStature()) : 1.0d;
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.KM_IS_NEW, false);
        int i = SpUtil.getInt(this.mContext, SputilVari.INT_PROTICL_TYPE, 0);
        if (i == 3 || i == 5) {
            if (this.mOriginalDFHandler == null) {
                OriginalDFHander originalDFHander = OriginalDFHander.getInstance();
                this.mOriginalDFHandler = originalDFHander;
                originalDFHander.init(this.mContext);
                this.mOriginalDFHandler.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
            }
            this.mOriginalDFHandler.readOriginalDfFirst();
            return;
        }
        if (this.mOriginalHandler == null) {
            OriginalHander originalHander = new OriginalHander(this.mContext);
            this.mOriginalHandler = originalHander;
            originalHander.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
            this.mOriginalHandler.setSupportSportModel(floatValue, z);
        }
        this.mOriginalHandler.readOriginalFirst();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readSleep() {
        if (this.mSleepHandler == null) {
            SleepHandler sleepHandler = SleepHandler.getInstance();
            this.mSleepHandler = sleepHandler;
            sleepHandler.init(this.mContext, this.mBindDataBean);
            this.mSleepHandler.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
        }
        this.mSleepHandler.readSleepFirst();
    }

    private void readDrink() {
        if (this.mDrinkHandler == null) {
            DrinkHandler drinkHandler = new DrinkHandler();
            this.mDrinkHandler = drinkHandler;
            drinkHandler.setContent(this.mBleWriterCall, this.onReadFinishCallBack, this.mBindDataBean);
        }
        this.mDrinkHandler.readDrink();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readNextDrink() {
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_DRINK, false);
        boolean z2 = SpUtil.getBoolean(this.mContext, SputilVari.IS_HAVE_DRINK_DATA, false);
        int i = SpUtil.getInt(this.mContext, SputilVari.INT_PROTICL_TYPE, 0);
        if (z && z2 && i != 3 && i != 5) {
            Logger.t(TAG).e("管理-->读取饮酒", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】[读取原始数据结束]->开始读取【饮酒数据】");
            readDrink();
        } else {
            Logger.t(TAG).e("管理-->无需读取饮酒", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】[读取原始数据结束]->#无需读取饮酒#->下一步读取【血氧数据】");
            readNextSpo2h();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readNextSpo2h() {
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_SPO2H, false);
        int i = SpUtil.getInt(this.mContext, SputilVari.INT_PROTICL_TYPE, 0);
        if (z && i != 3 && i != 5) {
            Logger.t(TAG).e("管理-->读取血氧原始数据", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】->开始读取【血氧数据】");
            readSpo2hOrigin();
        } else {
            Logger.t(TAG).e("管理-->无需读取血氧", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】#无需读取血氧#->下一步读取【运动数据】");
            readNextSportModel();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readNextSportModel() {
        if (SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_SPORT_MODEL, false)) {
            Logger.t(TAG).e("管理-->读取运动模式", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】->开始读取【运动数据】");
            readSportModel();
        } else {
            Logger.t(TAG).e("管理-->无需读取运动模式", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】#无需读取运动模式#->下一步读取【HRV数据】");
            readNextHRV();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readNextHRV() {
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_HRV, false);
        int i = SpUtil.getInt(this.mContext, SputilVari.INT_PROTICL_TYPE, 0);
        if (z && i != 3 && i != 5) {
            Logger.t(TAG).e("管理-->读取HRV数据", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】->开始读取【HRV数据】");
            readHRV();
        } else {
            Logger.t(TAG).e("管理-->无需读取HRV数据", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】#无需读取HRV数据#->下一步读取【ECG数据】");
            readNextECGManually();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readBodyComponent() {
        if (AppSPUtil.isHaveBodyComponentFunction()) {
            Logger.t(TAG).e("管理-->读取身体成分数据", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】->开始读取【身体成分数据ID-DATA】");
            BodyComponentReadManager.INSTANCE.getInstance().setReadFinishCallBack(this.onReadFinishCallBack);
            BodyComponentReadManager.INSTANCE.getInstance().readBodyComponentIds(false);
            return;
        }
        Logger.t(TAG).e("管理-->无需读取身体成分数据，准备读取体温数据", new Object[0]);
        HBLogger.bleChangeLog("【十分钟读取】#无需读取身体成分数据#->下一步读取【体温数据】");
        readNextTemptureOrigin();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readManualMeasurement() {
        if (ManualMeasurementReadManager.getInstance().isSupportManualMeasurement()) {
            ManualMeasurementReadManager.getInstance().setOnReadFinishCallBack(this.onReadFinishCallBack);
            ManualMeasurementReadManager.getInstance().startReadDeviceManualMeasureData();
        } else {
            HBLogger.bleChangeLog("【十分钟读取】#无需读取读取手动测量数据-->【数据读取完成】");
            finishReadData("管理-->无需读取读取手动测量数据-[数据读取完成]");
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readNextECGManually() {
        if (SpUtil.getBoolean(this.mContext, SputilVari.ECG_FUNCTION, false)) {
            Logger.t(TAG).e("管理-->读取手动测试的ECG", new Object[0]);
            this.ecgManager.setReadingECGAuto(false);
            this.ecgManager.setAfterTen(true);
            this.ecgManager.readECGManuallyData(null);
            this.ecgManager.setFinishCallBack(this.onReadFinishCallBack);
            HBLogger.bleChangeLog("【十分钟读取】->开始读取【ECG手动测量数据ID-DATA】");
            return;
        }
        Logger.t(TAG).e("管理-->无需读取手动测试的ECG，准备读取身体成分", new Object[0]);
        HBLogger.bleChangeLog("【十分钟读取】#无需读取手动测试ECG数据#->下一步读取【身体成分】");
        readBodyComponent();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readNextTemptureOrigin() {
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_TEMPTURE, false);
        int i = SpUtil.getInt(this.mContext, SputilVari.FUCTION_TEMPTURE_READ_DATA_TYPE, 0);
        if (z && ((i == 2 || i == 4) && !DeviceFunctionHandler.isBodyTemperatureInDF())) {
            Logger.t(TAG).e("管理-->读取温度数据", new Object[0]);
            HBLogger.bleChangeLog("【十分钟读取】->开始读取【温度数据】");
            readTemptureOrigin();
        } else {
            Logger.t(TAG).e("管理-->无需读取读取体温数据，准备读取身体成分", new Object[0]);
            if (DeviceFunctionHandler.isBodyTemperatureInDF()) {
                HBLogger.bleChangeLog("【十分钟读取】#无需读取读取体温数据-[体温数据在DF数据中]#->下一步读取【手动测量】");
            } else {
                HBLogger.bleChangeLog("【十分钟读取】#无需读取读取体温数据#->下一步读取【手动测量】");
            }
            readManualMeasurement();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void finishReadData(String str) {
        String str2 = TAG;
        Logger.t(str2).e(str, new Object[0]);
        MainActivity.isReadTenMinuteData = false;
        LocalBroadcastManager.getInstance(this.mContext).sendBroadcast(new Intent(BleBroadCast.READ_DEVICE_DATA_FINISH));
        Logger.t(str2).e("管理-->全结束", new Object[0]);
    }

    public void manage(String str, byte[] bArr) {
        if (str.equals(BleProfile.DEVICE_NUMBER)) {
            Logger.t(TAG).e("管理结束-->2.读取设备号", new Object[0]);
            new DeviceHandler(this.mContext).getReturnData(bArr);
            return;
        }
        if (str.equals(BleProfile.CHANGE_WATCH_LANGUAGE_OPRATE)) {
            Logger.t(TAG).e("管理结束-->3.设置语言", new Object[0]);
            return;
        }
        if (str.equals(BleProfile.READ_BATTERY_OPRATE)) {
            Logger.t(TAG).e("管理结束-->4.读取电量", new Object[0]);
            new BatteryHandler(this.mContext).getReturnData(bArr);
            BatteryReadManager.INSTANCE.getInstance().handlerData(bArr);
            return;
        }
        if (str.equals(BleProfile.PERSON_INFO_OPRATE)) {
            Logger.t(TAG).e("管理结束-->5.设置个人信息", new Object[0]);
            new PersonHandle(this.mContext).getReturnData(bArr);
            return;
        }
        if (str.equals(BleProfile.LONG_SERAT_OPRATE)) {
            if (this.isReadSettingWatch) {
                Logger.t(TAG).e("管理结束-->6.读取久坐,isReadTenMinuteData", new Object[0]);
                getLongseatHanlder().handlerLongseat(bArr, false);
                return;
            }
            return;
        }
        if (str.equals(BleProfile.HEART_WARING_OPRATE)) {
            if (bArr.length >= 5 && bArr[4] == 2 && bArr[6] == 0) {
                Logger.t(TAG).e("管理结束-->7.读取心率报警", new Object[0]);
                new HeartWarningHandler(this.mContext).handler(bArr, false);
                LocalBroadcastManager.getInstance(this.mContext).sendBroadcast(new Intent(SputilVari.UDPATE_HEART_WARNNING_TOGGLE));
                return;
            }
            return;
        }
        if (str.equals(BleProfile.NIGHT_TURN_OPEATE)) {
            if (bArr.length < 3 || bArr[2] != 2) {
                return;
            }
            Logger.t(TAG).e("管理结束-->8.读取夜间转腕", new Object[0]);
            new NightTurnWristHandler(this.mContext).getReturnData(bArr, false);
            return;
        }
        if (str.equals(BleProfile.BP_MODEL_OPRATE)) {
            if (bArr.length < 6 || bArr[5] != 2) {
                return;
            }
            Logger.t(TAG).e("管理结束-->9.读取血压模式", new Object[0]);
            getBpSettingHandler().getReturnData(bArr);
            return;
        }
        if (str.equals(BleProfile.ALL_SETTING_OPRATE)) {
            Logger.t(TAG).e("管理结束-->(9,10).读取血氧监测状态", new Object[0]);
            if (bArr.length < 4 || bArr[3] != 1) {
                return;
            }
            new AllSettingHanlder(this.mContext.getApplicationContext()).handler(bArr);
            return;
        }
        if (str.equals(BleProfile.SCREEN_LIGTH_OPRATE)) {
            if (bArr.length < 3 || bArr[2] != 2) {
                return;
            }
            Logger.t(TAG).e("管理结束-->10.没有返回,11.读取屏幕长亮", new Object[0]);
            new ScreenLightHanlder(this.mContext).handler(bArr);
            return;
        }
        if (str.equals(BleProfile.WEATHER_OPRATE)) {
            Logger.t(TAG).e("管理结束-->12.读取天气", new Object[0]);
            if (bArr.length > 2 && bArr[1] == 2) {
                new WeatherHandler(this.mContext.getApplicationContext()).handlerWeather(bArr);
            }
            if (bArr.length <= 2 || bArr[1] != 4) {
                return;
            }
            new WeatherHandler(this.mContext.getApplicationContext()).handlerWeather(bArr);
            return;
        }
        if (str.equals(BleProfile.SCREEN_LIGTH_TIME_OPRATE)) {
            Logger.t(TAG).e("管理结束-->13.读取屏幕亮度时长", new Object[0]);
            if (bArr.length <= 3 || bArr[2] != 2) {
                return;
            }
            new ScrenLightTimeHandler(this.mContext.getApplicationContext()).handler(bArr);
            return;
        }
        if (str.equals(BleProfile.ALARM_OPRATE)) {
            new AlarmHandler(this.mContext).handlerAlarm(bArr, false);
            AlarmHandler.getReturnData(bArr);
            if (bArr.length < 12 || bArr[11] != 6) {
                return;
            }
            Logger.t(TAG).e("管理结束-->14.读取闹钟", new Object[0]);
            return;
        }
        if (str.equals(BleProfile.READ_BATTERY_SLEEP)) {
            this.mSleepHandler.handlerCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.TEMPTURE_ORIGAL_OPRATE)) {
            TemptureOriginalHander temptureOriginalHander = this.mTemptureOriginalHander;
            if (temptureOriginalHander == null) {
                return;
            }
            temptureOriginalHander.handlerCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.HEAD_ORIGAL_DF_OPRATE)) {
            OriginalDFHander originalDFHander = this.mOriginalDFHandler;
            if (originalDFHander == null) {
                return;
            }
            originalDFHander.handlerCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.READ_BATTERY_ORIGINAL)) {
            OriginalHander originalHander = this.mOriginalHandler;
            if (originalHander != null) {
                originalHander.handlerCmd(bArr);
                return;
            }
            return;
        }
        if (str.equals(BleProfile.DRINK_OPRATE)) {
            this.mDrinkHandler.handlerCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.SPORT_MODEL_CRC_OPRATE) || str.equals(BleProfile.SPORT_MODEL_OPRATE_ORIGIN)) {
            this.mSportModelHandler.handlerCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.READ_BATTERY_SPO2H_ORIGINAL)) {
            this.mSpo2hOriginHandler.handlerCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.MULTI_ALARM_OPRATE)) {
            if (SpUtil.getBoolean(this.mContext, SputilVari.MULTI_TEXT_ALARM, false)) {
                ToastUtils.showDebug("文字闹钟----》");
                TextAlarmHandler.getInstance().handler(bArr);
                return;
            } else if (bArr.length >= 2 && bArr[1] == 3) {
                Logger.t(TAG).e("blemanager 收到[重新]读取闹钟，准备处理", new Object[0]);
                this.multiAlarmHandler.readingAlarm();
                return;
            } else {
                if (bArr.length <= 5 || bArr[4] != 2) {
                    return;
                }
                Logger.t(TAG).e("blemanager 收到读取闹钟，准备处理", new Object[0]);
                this.multiAlarmHandler.handlerMultiAlarm(bArr);
                return;
            }
        }
        if (str.equals(BleProfile.HRV_OPRATE)) {
            HRVHandler hRVHandler = this.mHRVHandler;
            if (hRVHandler != null) {
                hRVHandler.handlerCmd(bArr);
                return;
            }
            return;
        }
        if (str.equals(BleProfile.BATTERY_BIG_DATA_TARN)) {
            if (this.mBigDataHandler == null || bArr.length < 3 || bArr[1] != 2) {
                return;
            }
            if (bArr[2] == 2 || bArr[2] == 1) {
                Logger.t(TAG).e("管理结束-->17.UI基本信息[2600ms]", new Object[0]);
                this.mBigDataHandler.handleBigTranBaseInfo(bArr);
                return;
            }
            return;
        }
        if (str.equals(BleProfile.BATTERY_LOWPOWER)) {
            Logger.t(TAG).e("管理结束-->16.低功耗的表", new Object[0]);
            LowPowerHandler lowPowerHandler = this.mLowPowerHandler;
            if (lowPowerHandler == null || bArr.length < 3 || bArr[2] != 2) {
                return;
            }
            lowPowerHandler.handleByte(bArr);
            return;
        }
        if (str.equals(BleProfile.ECG_DATA_APP_OPRATE)) {
            return;
        }
        if (str.equals(BleProfile.ECG_DATA_GET_ID_OPRATE)) {
            String str2 = TAG;
            Logger.t(str2).e("app get id命令返回:" + ConvertHelper.byte2HexForShow(bArr), new Object[0]);
            Logger.t(str2).e("<ECG-ID> 0x96 ECG ID ---> value = " + ConvertHelper.byte2HexForShow(bArr), new Object[0]);
            if (bArr[1] == -94) {
                Logger.t(str2).e("<ECG-ID> 0x96 A2 ---> ecg 上报 刷新ecg列表", new Object[0]);
                readBleData();
                return;
            } else {
                this.ecgManager.handlerGetId(bArr);
                return;
            }
        }
        if (str.equals(BleProfile.ECG_DATA_USE_ID_OPRATE)) {
            this.ecgManager.handlerUseId(bArr);
            Logger.t(TAG).e("0x97========>>>app get data命令返回", new Object[0]);
            return;
        }
        if (str.equals(BleProfile.BLOOD_GLUCOSE_ADJUSTING_OPERATE)) {
            BloodGlucoseHandler.getInstance().handlerBGAdjustingCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.BLOOD_GLUCOSE_SIX_ADJUSTING_OPERATE)) {
            BloodGlucoseHandler.getInstance().handlerSixBGAdjustingCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.K_BT_OPERATE)) {
            SpUtil.saveBoolean(this.mContext, SputilVari.IS_HAVE_BT_CALL, true);
            KDeviceBTHandler.getInstance().handler(bArr);
            return;
        }
        if (str.equals(BleProfile.BODY_COMPONENT_OPERATE)) {
            if (bArr[1] == 5 && bArr[2] == -95) {
                readBleData();
                return;
            } else {
                BodyComponentHandler.INSTANCE.getInstance().handlerRead(bArr);
                return;
            }
        }
        if (str.equals(BleProfile.AI_OPERATE)) {
            Logger.t(TAG).e("AI数据监听: BleReadManager -manage-" + ConvertHelper.byte2HexForShow(bArr), new Object[0]);
            AIFunctionHandler.INSTANCE.getInstance().handlerCmd(bArr);
            return;
        }
        if (str.equals(BleProfile.MANUAL_MEASUREMENT_OPERATE)) {
            ManualMeasurementHandler.getInstance().handler(bArr);
        } else if (str.equals(BleProfile.QUICK_QRCODE_OPERATE)) {
            QuickQRCodeHandler.INSTANCE.getInstance().handler(bArr);
        }
    }

    private void readBleData() {
        StringBuilder sb = new StringBuilder();
        String str = TAG;
        sb.append(str);
        sb.append("--动画");
        Logger.t(sb.toString()).e("-ReadManager readBleData ", new Object[0]);
        Logger.t(str).d("BATTERY_SERVER_READ_DATA");
        Intent intent = new Intent(BleBroadCast.BATTERY_SERVER_READ_DATA);
        intent.putExtra(BleIntentPut.BLE_OPTION, "我想要读取数据");
        LocalBroadcastManager.getInstance(this.mContext.getApplicationContext()).sendBroadcast(intent);
    }

    public void setOnbleWriteCallback(OnBleWriteCallback onBleWriteCallback) {
        this.mBleWriterCall = onBleWriteCallback;
    }

    private BPSettingHandler getBpSettingHandler() {
        return new BPSettingHandler(this.mContext, BaseUtil.getInterValue(SpUtil.getString(this.mContext, SputilVari.BP_SETTING_HIGHT, "120")), BaseUtil.getInterValue(SpUtil.getString(this.mContext, SputilVari.BP_SETTING_LOW, "80")));
    }

    private LongseatHanlder getLongseatHanlder() {
        return new LongseatHanlder(this.mContext, SpUtil.getInt(this.mContext, SputilVari.LONG_SEAT_START_TIME, 480), SpUtil.getInt(this.mContext, SputilVari.LONG_SEAT_END_TIME, R2.attr.rsb_thumb_scale_ratio), SpUtil.getInt(this.mContext, SputilVari.LONG_SEAT_HOWLONG_TIME, 60));
    }

    class ReadSportTask extends TimerTask {
        ReadSportTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            BleReadManager.this.isReadSettingWatch = true;
            Logger.t(BleReadManager.TAG).e("管理-->1.读取计步,100ms", new Object[0]);
            BleReadManager.this.readSport();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readSport() {
        if (SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_SPORT_MODEL, false)) {
            this.mBleWriterCall.bleWriteCallback(BATTERY_SERVICE_UUID, BATTERY_CONFIG_UUID, RATE_CURRENT_SPORT_MODEL);
        } else {
            this.mBleWriterCall.bleWriteCallback(BATTERY_SERVICE_UUID, BATTERY_CONFIG_UUID, RATE_CURRENT_SPORT);
        }
    }

    class SettingHidTask extends TimerTask {
        SettingHidTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->1_1.设置HID绑定,200ms", new Object[0]);
            BleReadManager.this.settingHid();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void settingHid() {
        if (SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_HID, false)) {
            this.mBleWriterCall.bleWriteCallback(BATTERY_SERVICE_UUID, BATTERY_CONFIG_UUID, HID_BIND);
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void readSpo2hNightMonitor() {
        if (SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_SPO2H, false)) {
            new AllSettingHanlder(this.mContext.getApplicationContext()).setting(new AllSettingBean(AllSettingHanlder.ALLSETTINGTYPE.SPO2H_NIGHT_MONITOR, 22, 0, 8, 0, 1, 0));
        }
    }

    class ReadDeviceNumberTask extends TimerTask {
        ReadDeviceNumberTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->2.读取设备号,300ms", new Object[0]);
            BleReadManager.this.readDeviceNumber();
        }
    }

    class SettingLanguageTask extends TimerTask {
        SettingLanguageTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->3.设置语言,400ms", new Object[0]);
            BleReadManager.this.settingLanguage();
        }
    }

    class ReadBatteryTask extends TimerTask {
        ReadBatteryTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->4.读取电量,500ms", new Object[0]);
            BleReadManager.this.readBattery();
        }
    }

    class SettingPersonInfoTask extends TimerTask {
        SettingPersonInfoTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->5.设置个人信息[600ms]", new Object[0]);
            BleReadManager.this.settingPersonInfo();
        }
    }

    class ReadLongSeatTask extends TimerTask {
        ReadLongSeatTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->6.读取久坐[700ms]", new Object[0]);
            BleReadManager.this.readLongSeat();
        }
    }

    class ReadHeartWaringTask extends TimerTask {
        ReadHeartWaringTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->7.读取心率报警[900ms]", new Object[0]);
            new HeartWarningHandler(BleReadManager.this.mContext).readHeartWarning();
        }
    }

    class ReadNightTurnTask extends TimerTask {
        ReadNightTurnTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            if (SpUtil.getBoolean(BleReadManager.this.mContext, SputilVari.FUCTION_NIGHTTURN_SETTING, false)) {
                Logger.t(BleReadManager.TAG).e("管理-->8.读取夜间转腕[1100ms]", new Object[0]);
                new NightTurnWristHandler(BleReadManager.this.mContext).read();
            }
        }
    }

    class ReadBpTask extends TimerTask {
        ReadBpTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->9.读取血压[1300ms]", new Object[0]);
            BleReadManager.this.readBPSetting();
        }
    }

    class SettingWomenTask extends TimerTask {
        SettingWomenTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->10.设置女性[1600ms]", new Object[0]);
            BleReadManager.this.settingWomen();
        }
    }

    class ReadScreenLight extends TimerTask {
        ReadScreenLight() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->11.读取调节屏幕设置[1750ms]", new Object[0]);
            BleReadManager.this.readScreenLight();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void ReadWeather() {
        if (SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_WEATHER, false)) {
            Logger.t(TAG).e("管理-->12.读取天气[1850ms]", new Object[0]);
            new WeatherHandler(this.mContext.getApplicationContext()).readingWeather();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void ReadScreenLightTime() {
        if (SpUtil.getBoolean(this.mContext, SputilVari.FUCTION_SCREENLIGNT_TIME, false)) {
            Logger.t(TAG).e("管理-->13.读取屏幕时长[1950ms]", new Object[0]);
            new ScrenLightTimeHandler(this.mContext.getApplicationContext()).readScreenLightTime();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void ReadBatteryManagerInfo() {
        Logger.t(TAG).e("管理-->14.读取电池信息[2100ms]", new Object[0]);
        new BatterManagerHandler(this.mContext.getApplicationContext()).readAllDay();
    }

    class ReadAlarmTask extends TimerTask {
        ReadAlarmTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->15.读取闹钟[2300ms]", new Object[0]);
            BleReadManager.this.readAlarm();
            BleReadManager.this.isReadSettingWatch = false;
        }
    }

    static class ReadBloodGlucoseAdjustingTask extends TimerTask {
        ReadBloodGlucoseAdjustingTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->16.读取血糖校准值[2300ms]", new Object[0]);
            BloodGlucoseHandler.getInstance().readBloodGlucoseAdjustingSettings();
        }
    }

    class ReadServerUiConfigTask extends TimerTask {
        ReadServerUiConfigTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->18.UI基本信息server[2600ms]", new Object[0]);
            BleReadManager.this.readUiServerConfig();
        }
    }

    class ReadCustomUiConfigTask extends TimerTask {
        ReadCustomUiConfigTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->19.UI基本信息custom[2600ms]", new Object[0]);
            BleReadManager.this.readUiCustomConfig();
        }
    }

    class ReadLowPowerTask extends TimerTask {
        ReadLowPowerTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->17.低功耗[2500ms]", new Object[0]);
            BleReadManager.this.readLowPower();
        }
    }

    static class ReadTemperatureAlarmTask extends TimerTask {
        ReadTemperatureAlarmTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理-->.读取体温报警数据", new Object[0]);
            AlarmRangeHandler.INSTANCE.getInstance().readAlarmRange(EAlarmRangeType.TEMPERATURE_LOW_HIGH);
        }
    }

    static class ReadBloodCompositionAdjustingTask extends TimerTask {
        ReadBloodCompositionAdjustingTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理--> 读取血液成分校准值", new Object[0]);
            BloodCompositionHandler.INSTANCE.getInstance().readBloodComposition();
        }
    }

    static class ReadAIConfigTask extends TimerTask {
        ReadAIConfigTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            Logger.t(BleReadManager.TAG).e("管理--> 读取AI配置信息", new Object[0]);
            AIFunctionHandler.INSTANCE.getInstance().readAllAIConfig();
        }
    }

    class ReadSleepTask extends TimerTask {
        ReadSleepTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            BleReadManager.this.readSleep();
        }
    }

    class ReadSpo2hNightMonitorTask extends TimerTask {
        ReadSpo2hNightMonitorTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            BleReadManager.this.readSpo2hNightMonitor();
        }
    }

    class ReadWeatherTask extends TimerTask {
        ReadWeatherTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            BleReadManager.this.ReadWeather();
        }
    }

    class ReadScreenLightTimeTask extends TimerTask {
        ReadScreenLightTimeTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            BleReadManager.this.ReadScreenLightTime();
        }
    }

    class ReadBatteryManagerInfoTask extends TimerTask {
        ReadBatteryManagerInfoTask() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            BleReadManager.this.ReadBatteryManagerInfo();
        }
    }

    private class ReadContact extends TimerTask {
        private ReadContact() {
        }

        @Override // java.util.TimerTask, java.lang.Runnable
        public void run() {
            SpUtil.getInt(BleReadManager.this.mContext, SputilVari.CONTACT_CRC_FORM_APP, 0);
            SpUtil.getInt(BleReadManager.this.mContext, SputilVari.CONTACT_CRC_FORM_DEVICE, 0);
            SpUtil.saveString(BleReadManager.this.mContext, SputilVari.CONTACT_LIST, "");
            ContactHandler.INSTANCE.getInstance().readContactList(-1);
        }
    }
}