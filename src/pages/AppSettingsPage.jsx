import { useState } from 'react';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export default function AppSettingsPage() {
  const { data, updateSettings, updateBagrutSettings, updateDefaultGenderTrack, defaultGenderTrack: storeDefaultGender } = useApp();

  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('teacherName') || '');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('schoolName') || '');
  const [defaultSemester, setDefaultSemester] = useState(() => localStorage.getItem('defaultSemester') || 'A');
  const [genderTrack, setGenderTrack] = useState(storeDefaultGender);

  const [penaltyScore, setPenaltyScore] = useState(data.settings.penaltyScore ?? 15);
  const [autoConvertMissing, setAutoConvertMissing] = useState(data.settings.autoConvertMissing ?? false);
  const [minCompletedGrade, setMinCompletedGrade] = useState(data.settings.minCompletedGrade ?? 56);
  const [redBelow, setRedBelow] = useState(data.settings.gradeColorThresholds?.redBelow ?? 55);
  const [greenAt, setGreenAt] = useState(data.settings.gradeColorThresholds?.greenAt ?? 100);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('teacherName', teacherName);
    localStorage.setItem('schoolName', schoolName);
    localStorage.setItem('defaultSemester', defaultSemester);

    await updateSettings({
      penaltyScore, autoConvertMissing, minCompletedGrade,
      gradeColorThresholds: { redBelow, greenAt },
    });
    await updateDefaultGenderTrack(genderTrack);
    setSaving(false);
    toast.success('ההגדרות נשמרו');
  };

  return (
    <Layout title="הגדרות" backTo="/">
      <div className="max-w-lg mx-auto space-y-4 p-4 pb-8" dir="rtl">
        {/* Profile */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">פרטי מורה</h3>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">שם המורה</Label>
                <Input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="שם מלא" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">שם המוסד</Label>
                <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="שם בית הספר" className="h-8 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defaults */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">ברירות מחדל</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">מחצית ברירת מחדל</Label>
                <Select value={defaultSemester} onValueChange={v => setDefaultSemester(v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">מחצית א׳</SelectItem>
                    <SelectItem value="B">מחצית ב׳</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">מסלול ברירת מחדל</Label>
                <Select value={genderTrack} onValueChange={v => setGenderTrack(v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">בנים</SelectItem>
                    <SelectItem value="girls">בנות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Calculation */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">חישוב ציונים</h3>

            <div className="space-y-1">
              <Label className="text-xs">ציון עונשין לאי-ביצוע</Label>
              <div className="flex items-center gap-3">
                <Input type="number" min={0} max={100} value={penaltyScore} onChange={e => setPenaltyScore(Number(e.target.value))} className="h-8 text-sm w-20" />
                <span className="text-xs text-muted-foreground">ציון שמוקצה לתלמיד שלא ביצע מבדק (ברירת מחדל: 15)</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">ציון מינימום לביצוע מבדק</Label>
              <div className="flex items-center gap-3">
                <Input type="number" min={0} max={100} value={minCompletedGrade} onChange={e => setMinCompletedGrade(Number(e.target.value))} className="h-8 text-sm w-20" />
                <span className="text-xs text-muted-foreground">ציון רצפה לביצוע (ברירת מחדל: 56)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={autoConvertMissing} onCheckedChange={setAutoConvertMissing} />
              <div>
                <Label className="text-xs">המרה אוטומטית של חסרים</Label>
                <p className="text-[10px] text-muted-foreground">חסרים יחושבו אוטומטית כ"לא ביצע"</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">סף ציון אדום</Label>
              <div className="flex items-center gap-3">
                <Input type="number" min={0} max={100} value={redBelow} onChange={e => setRedBelow(Number(e.target.value))} className="h-8 text-sm w-20" />
                <span className="text-xs text-muted-foreground">ציונים מתחת יסומנו באדום</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl btn-3d font-semibold text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
          שמור הגדרות
        </Button>
      </div>
    </Layout>
  );
}