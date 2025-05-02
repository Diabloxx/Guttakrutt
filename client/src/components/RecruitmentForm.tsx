import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { insertApplicationSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import guildLogo from '../assets/guild-logo.png';

// Extend the application schema with more validation
const applicationFormSchema = insertApplicationSchema.extend({
  className: z.string().min(2, "Please select your class"),
  specName: z.string().min(2, "Please select your specialization"),
  characterName: z.string().min(2, "Character name must be at least 2 characters"),
  realm: z.string().min(2, "Realm name is required"),
  itemLevel: z.coerce.number().min(1, "Item level must be a number"),
  experience: z.string().min(10, "Please describe your raiding experience"),
  availability: z.string().min(10, "Please describe your availability"),
  contactInfo: z.string().min(5, "Please provide a way to contact you"),
  whyJoin: z.string().min(10, "Please tell us why you want to join"),
  // Make these optional fields
  raiders: z.string().optional(),
  referredBy: z.string().optional(),
  additionalInfo: z.string().optional(),
  logs: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationFormSchema>;

export default function RecruitmentForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      characterName: '',
      className: '',
      specName: '',
      realm: 'Tarren Mill',
      itemLevel: 0,
      experience: '',
      availability: '',
      contactInfo: '',
      whyJoin: '',
      raiders: '',
      referredBy: '',
      additionalInfo: '',
      logs: '',
    },
  });

  const classesList = [
    'Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Hunter', 'Mage', 
    'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'
  ];

  // Class specs mapping
  const specsByClass: { [key: string]: string[] } = {
    'Death Knight': ['Blood', 'Frost', 'Unholy'],
    'Demon Hunter': ['Havoc', 'Vengeance'],
    'Druid': ['Balance', 'Feral', 'Guardian', 'Restoration'],
    'Evoker': ['Devastation', 'Preservation', 'Augmentation'],
    'Hunter': ['Beast Mastery', 'Marksmanship', 'Survival'],
    'Mage': ['Arcane', 'Fire', 'Frost'],
    'Monk': ['Brewmaster', 'Mistweaver', 'Windwalker'],
    'Paladin': ['Holy', 'Protection', 'Retribution'],
    'Priest': ['Discipline', 'Holy', 'Shadow'],
    'Rogue': ['Assassination', 'Outlaw', 'Subtlety'],
    'Shaman': ['Elemental', 'Enhancement', 'Restoration'],
    'Warlock': ['Affliction', 'Demonology', 'Destruction'],
    'Warrior': ['Arms', 'Fury', 'Protection'],
  };

  const mutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const response = await apiRequest('POST', '/api/applications', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Application Submitted',
        description: 'Your application has been received. We will review it and be in touch soon.',
        variant: 'default',
      });
      setSubmitted(true);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to submit application: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(data: ApplicationFormData) {
    mutation.mutate(data);
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-wow-gold/30 bg-white text-gray-900">
        <CardHeader className="border-b border-wow-gold/20">
          <div className="flex justify-center mb-4">
            <img 
              src={guildLogo} 
              alt="Guttakrutt Logo"
              className="h-24 object-contain"
              style={{ filter: 'drop-shadow(0 0 6px rgba(171, 244, 0, 0.4))' }}
            />
          </div>
          <CardTitle className="text-2xl text-center text-wow-gold">Application Submitted!</CardTitle>
          <CardDescription className="text-center text-gray-800">
            Thank you for your interest in Guttakrutt
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
          <CheckCircle className="h-16 w-16 text-wow-gold" />
          <p className="text-gray-800">Your application has been received and will be reviewed by our recruitment team.</p>
          <p className="text-gray-800">We will contact you via the provided contact information if there is a suitable position available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-wow-gold/30 bg-white text-gray-900">
      <CardHeader className="border-b border-wow-gold/20">
        <div className="flex justify-center mb-4">
          <img 
            src={guildLogo} 
            alt="Guttakrutt Logo"
            className="h-24 object-contain"
            style={{ filter: 'drop-shadow(0 0 6px rgba(171, 244, 0, 0.4))' }}
          />
        </div>
        <CardTitle className="text-2xl text-wow-gold">Guild Application</CardTitle>
        <CardDescription className="text-gray-800">
          Apply to join Guttakrutt raiding team. We'll review your application and contact you.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-gray-800">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="characterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-wow-gold/90">Character Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your character name" 
                        value={field.value} 
                        onChange={field.onChange}
                        className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="realm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-wow-gold/90">Realm</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Tarren Mill" 
                        value={field.value} 
                        onChange={field.onChange}
                        className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="className"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-wow-gold/90">Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900">
                          <SelectValue placeholder="Select your class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-wow-gold/30 text-gray-900">
                        {classesList.map((className) => (
                          <SelectItem key={className} value={className}>
                            {className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-wow-gold/90">Specialization</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch('className')}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900">
                          <SelectValue placeholder="Select your specialization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-wow-gold/30 text-gray-900">
                        {form.watch('className') && specsByClass[form.watch('className')]?.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="itemLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-wow-gold/90">Item Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g. 478" 
                        value={field.value}
                        onChange={field.onChange}
                        className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-wow-gold/90">Contact Information</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Battle.net tag or Discord" 
                        value={field.value}
                        onChange={field.onChange}
                        className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600">
                      How can we reach you outside of the game?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-wow-gold/90">Raiding Experience</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your previous raiding experience and achievements"
                      className="min-h-[100px] bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-600">
                    Include any Cutting Edge achievements, guild progression, and your role.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="logs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-wow-gold/90">Logs</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Links to your WarcraftLogs profile or specific logs"
                      className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-600">
                    Providing logs helps us assess your performance.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-wow-gold/90">Availability</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Which days and times are you available for raiding?"
                      className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-600">
                    Main raid: Sunday/Wednesday 19:20-23:00. Second team: Monday 20:00-23:00.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="whyJoin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-wow-gold/90">Why Guttakrutt?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Why do you want to join our guild specifically?"
                      className="min-h-[100px] bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="raiders"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-wow-gold/90">Do you know anyone in the guild?</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Names of members you know" 
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="referredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-wow-gold/90">Referred By</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Who referred you to us?" 
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-wow-gold/90">Additional Information</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Anything else you'd like us to know about you?"
                      className="bg-white border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30 text-gray-900"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={mutation.isPending} 
                className="w-full md:w-auto bg-wow-gold hover:bg-wow-gold/90 text-wow-dark border border-wow-gold/50 font-semibold"
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}