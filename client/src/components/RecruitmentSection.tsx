import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RecruitmentForm from './RecruitmentForm';
import { Guild } from '@shared/schema';
import { useTranslation } from 'react-i18next';

interface RecruitmentSectionProps {
  guild?: Guild;
}

export default function RecruitmentSection({ guild }: RecruitmentSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const { t } = useTranslation();
  
  // Define current recruitment needs - this could come from an API or context
  const recruitmentNeeds = [
    { role: 'Tank', classes: ['Death Knight (Blood)', 'Monk (Brewmaster)'], priority: 'high' },
    { role: 'Healer', classes: ['Priest (Discipline)', 'Paladin (Holy)'], priority: 'medium' },
    { role: 'DPS', classes: ['Mage (Fire)', 'Warlock (Affliction)', 'Rogue (Any)'], priority: 'high' },
    { role: 'Ranged DPS', classes: ['Hunter (Marksmanship)', 'Balance (Druid)'], priority: 'medium' },
  ];
  
  // Information about the raid teams
  const raidTeams = [
    {
      name: 'Main Team',
      description: 'Main raiding team led by Truedream aiming for Cutting Edge.',
      schedule: 'Sunday and Wednesday, 19:20-23:00',
      progress: 'Currently 4/8 Mythic in Liberation of Undermine',
      contact: 'Truedream'
    },
    {
      name: 'Blåmandag',
      description: 'More casual second team led by Spritney for those who can only raid once a week.',
      schedule: 'Monday, 20:00-23:00',
      progress: 'Currently progressing through Heroic Liberation of Undermine',
      contact: 'Spritney'
    }
  ];

  return (
    <section id="recruitment" className="py-10 md:py-16 lg:py-20 bg-wow-secondary border-t-0 mt-0">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4 text-center mb-8 md:mb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl text-wow-green relative">
            <span className="relative z-10">{t('recruitment.title')}</span>
            <span className="block h-1 bg-wow-green/50 w-16 sm:w-24 mx-auto mt-2"></span>
          </h2>
          <p className="max-w-[700px] text-sm sm:text-base text-wow-light/90 md:text-lg/relaxed lg:text-xl/relaxed">
            {t('recruitment.description')}
          </p>
        </div>

        <Tabs defaultValue="needs" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 border-wow-green/30 bg-wow-dark/80 rounded-md overflow-hidden">
            <TabsTrigger 
              value="needs" 
              className="data-[state=active]:bg-wow-green/20 data-[state=active]:text-wow-green hover:text-wow-green/90 text-wow-light text-xs sm:text-sm md:text-base py-2 md:py-3"
            >
              {t('recruitment.tabs.currentNeeds')}
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className="data-[state=active]:bg-wow-green/20 data-[state=active]:text-wow-green hover:text-wow-green/90 text-wow-light text-xs sm:text-sm md:text-base py-2 md:py-3"
            >
              {t('recruitment.tabs.raidTeams')}
            </TabsTrigger>
            <TabsTrigger 
              value="apply" 
              className="data-[state=active]:bg-wow-green/20 data-[state=active]:text-wow-green hover:text-wow-green/90 text-wow-light text-xs sm:text-sm md:text-base py-2 md:py-3"
            >
              {t('recruitment.tabs.applyNow')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="needs">
            <Card className="border-wow-green/30 bg-wow-dark/80 text-wow-light shadow-md">
              <CardHeader className="border-b border-wow-green/20 p-4 md:p-6">
                <CardTitle className="text-xl sm:text-2xl text-wow-green">{t('recruitment.needs.title')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-wow-light/80">
                  {t('recruitment.needs.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {recruitmentNeeds.map((need, index) => (
                    <div key={index} className="flex flex-col space-y-2 bg-wow-secondary/50 p-3 md:p-4 rounded-md border border-wow-green/20 shadow-md hover:border-wow-green/40 transition-all">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-wow-green">{need.role}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          need.priority === 'high' ? 'bg-red-900/50 text-red-200 border border-red-500/30' :
                          need.priority === 'medium' ? 'bg-amber-900/50 text-amber-200 border border-amber-500/30' :
                          'bg-green-900/50 text-green-200 border border-green-500/30'
                        }`}>
                          {need.priority === 'high' ? t('recruitment.priority.high') :
                           need.priority === 'medium' ? t('recruitment.priority.medium') : t('recruitment.priority.low')}
                        </span>
                      </div>
                      <ul className="list-disc pl-4 md:pl-5 text-wow-light/80 text-sm sm:text-base space-y-1">
                        {need.classes.map((cls, i) => (
                          <li key={i}>{cls}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-6 md:mt-8 text-center">
                  <Button onClick={() => setShowForm(true)} 
                    className="bg-wow-dark text-wow-green hover:bg-wow-green hover:text-wow-dark border-2 border-wow-green transition-colors text-sm sm:text-base px-4 sm:px-6">
                    {t('recruitment.buttons.applyNow')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teams">
            <Card className="border-wow-green/30 bg-wow-dark/80 text-wow-light shadow-md">
              <CardHeader className="border-b border-wow-green/20 p-4 md:p-6">
                <CardTitle className="text-xl sm:text-2xl text-wow-green">{t('recruitment.teams.title')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-wow-light/80">
                  {t('recruitment.teams.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  {raidTeams.map((team, index) => (
                    <Card key={index} className="border border-wow-green/30 bg-wow-secondary/50 text-wow-light overflow-hidden shadow-md hover:shadow-lg hover:border-wow-green/40 transition-all">
                      <CardHeader className="bg-wow-dark/60 border-b border-wow-green/20 p-4 md:p-6">
                        <CardTitle className="text-lg sm:text-xl text-wow-green">{team.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-wow-light/80">{t('recruitment.teams.ledBy')} {team.contact}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                        <div className="space-y-3 md:space-y-4">
                          <div>
                            <h4 className="font-medium mb-1 text-wow-green/90 text-sm sm:text-base">{t('recruitment.teams.description_label')}</h4>
                            <p className="text-xs sm:text-sm text-wow-light/80">{team.description}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1 text-wow-green/90 text-sm sm:text-base">{t('recruitment.teams.schedule')}</h4>
                            <p className="text-xs sm:text-sm text-wow-light/80">{team.schedule}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1 text-wow-green/90 text-sm sm:text-base">{t('recruitment.teams.progress')}</h4>
                            <p className="text-xs sm:text-sm text-wow-light/80">{team.progress}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-6 md:mt-8 text-center">
                  <Button onClick={() => setShowForm(true)} 
                    className="bg-wow-dark text-wow-green hover:bg-wow-green hover:text-wow-dark border-2 border-wow-green transition-colors text-sm sm:text-base px-4 sm:px-6">
                    {t('recruitment.buttons.applyNow')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="apply">
            {showForm ? (
              <RecruitmentForm />
            ) : (
              <Card className="border-wow-green/30 bg-wow-dark/80 text-wow-light shadow-md">
                <CardHeader className="border-b border-wow-green/20 p-4 md:p-6">
                  <CardTitle className="text-xl sm:text-2xl text-wow-green">{t('recruitment.apply.title')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-wow-light/80">
                    {t('recruitment.apply.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6 md:py-8 px-4 md:px-6">
                  <p className="mb-6 text-wow-light/80 text-sm sm:text-base">
                    {t('recruitment.apply.formDescription')}
                  </p>
                  <Button 
                    onClick={() => setShowForm(true)} 
                    size="lg"
                    className="bg-wow-dark text-wow-green hover:bg-wow-green hover:text-wow-dark border-2 border-wow-green transition-colors font-semibold px-6 sm:px-8 py-2 text-sm sm:text-base"
                  >
                    {t('recruitment.buttons.startApplication')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}