# Royal Hires Payroll — Android phone එකෙන් APK build කිරීම

මෙම project ZIP එකේ APK binary එක තවම නැත. Android Studio නැති phone එකකින් build කරගැනීමට GitHub Actions cloud build workflow එක ඇතුළත් කර ඇත.

## Android phone එකෙන් පියවර
1. මෙම ZIP එක extract කර එහි ඇති `royal-hires-app` folder එකේ අන්තර්ගත files GitHub repository එකකට upload කරන්න. GitHub හි නව repository එකක් සෑදීමෙන් පටන් ගන්න. ZIP එක repository එකටම upload කිරීම ප්‍රමාණවත් නොවේ; එය extract කර files upload කළ යුතුය.
2. Repository එකේ `.github/workflows/build-android-apk.yml` file එක තිබෙන බව තහවුරු කරන්න.
3. GitHub repository එකේ **Actions** tab එක විවෘත කරන්න.
4. **Build Android APK** workflow එක තෝරන්න.
5. **Run workflow** තට්ටු කර නැවත **Run workflow** තෝරන්න.
6. Build එක අවසන් වූ පසු workflow run එක විවෘත කර **Artifacts** යටතේ `royal-hires-payroll-debug-apk` download කරන්න.
7. Download වූ artifact ZIP එක extract කර `app-debug.apk` ගොනුව Android phone එකට install කරන්න. Android අවශ්‍ය නම් browser/file manager එකට “Install unknown apps” permission දෙන්න.

## සටහන්
- මෙය පරීක්ෂණ/අභ්‍යන්තර භාවිතය සඳහා debug APK එකකි; Play Store release-signing APK එකක් නොවේ.
- මුල් source එකේ Gemini API key එක client-side වෙත යා හැකි ආකාරයක් තිබිය හැක. සැබෑ API key එක source code එකට හෝ ZIP එකට ඇතුළත් නොකරන්න.
- Payroll/employee දත්ත සංවේදී බැවින්, සැබෑ දත්ත ඇතුළත් කිරීමට පෙර backup/restore, authentication සහ data storage ආරක්ෂාව පරීක්ෂා කරන්න.
