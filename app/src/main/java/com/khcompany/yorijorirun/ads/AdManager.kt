package com.khcompany.yorijorirun.ads

import android.app.Activity
import android.content.Context
import android.content.pm.ApplicationInfo
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.OnUserEarnedRewardListener
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

private const val TAG = "AdManager"

// Release ad units. Still Google's sample IDs: this game needs its own AdMob app and units before
// release (see NEW_GAME_SETUP.md). Never reuse Lane Dash's IDs.
private const val INTERSTITIAL_UNIT_ID = "ca-app-pub-3940256099942544/1033173712"
private const val REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/5224354917"

// Google's official sample units, used for debuggable builds so development and testing
// never generate real impressions/clicks on the live ad units (an AdMob policy risk).
private const val TEST_INTERSTITIAL_UNIT_ID = "ca-app-pub-3940256099942544/1033173712"
private const val TEST_REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/5224354917"

/**
 * Thin wrapper around the Google Mobile Ads SDK: an interstitial for the occasional
 * game-over screen, and a rewarded ad for the one-per-run "continue" option. Always keeps
 * one of each preloaded so showing one is instant when the moment actually comes.
 */
class AdManager(context: Context) {
    private val appContext = context.applicationContext
    private val debuggable = (appContext.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    private val interstitialUnitId = if (debuggable) TEST_INTERSTITIAL_UNIT_ID else INTERSTITIAL_UNIT_ID
    private val rewardedUnitId = if (debuggable) TEST_REWARDED_UNIT_ID else REWARDED_UNIT_ID
    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null
    private var sdkInitialized = false

    fun init() {
        if (sdkInitialized) return
        sdkInitialized = true
        MobileAds.initialize(appContext) {
            loadInterstitial()
            loadRewarded()
        }
    }

    /** Compose-observable so the game-over UI can reactively show/hide the continue option. */
    var isRewardedReady by mutableStateOf(false)
        private set

    private fun loadInterstitial() {
        InterstitialAd.load(
            appContext,
            interstitialUnitId,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.w(TAG, "interstitial failed to load: ${error.message}")
                    interstitialAd = null
                }
            },
        )
    }

    private fun loadRewarded() {
        RewardedAd.load(
            appContext,
            rewardedUnitId,
            AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    isRewardedReady = true
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.w(TAG, "rewarded failed to load: ${error.message}")
                    rewardedAd = null
                    isRewardedReady = false
                }
            },
        )
    }

    /** Shows the preloaded interstitial if one's ready; otherwise just calls [onDone] immediately. */
    fun showInterstitial(activity: Activity, onDone: () -> Unit) {
        val ad = interstitialAd
        if (ad == null) {
            onDone()
            return
        }
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                loadInterstitial()
                onDone()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                interstitialAd = null
                loadInterstitial()
                onDone()
            }
        }
        ad.show(activity)
    }

    /**
     * Shows the preloaded rewarded ad. [onReward] fires only if the player actually watches
     * it through; [onUnavailable] fires if there's no ad ready or they dismiss it early.
     */
    fun showRewarded(activity: Activity, onReward: () -> Unit, onUnavailable: () -> Unit) {
        val ad = rewardedAd
        if (ad == null) {
            onUnavailable()
            return
        }
        isRewardedReady = false
        var earnedReward = false
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                rewardedAd = null
                loadRewarded()
                if (!earnedReward) onUnavailable()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                rewardedAd = null
                loadRewarded()
                onUnavailable()
            }
        }
        ad.show(
            activity,
            OnUserEarnedRewardListener {
                earnedReward = true
                onReward()
            },
        )
    }
}
