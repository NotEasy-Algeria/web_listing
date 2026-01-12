-- Trigger to auto-update updated_at on admins
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on doctors
DROP TRIGGER IF EXISTS update_doctors_updated_at ON public.doctors;
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on abonnements
DROP TRIGGER IF EXISTS update_abonnements_updated_at ON public.abonnements;
CREATE TRIGGER update_abonnements_updated_at
BEFORE UPDATE ON public.abonnements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on sub_type
DROP TRIGGER IF EXISTS update_sub_type_updated_at ON public.sub_type;
CREATE TRIGGER update_sub_type_updated_at
BEFORE UPDATE ON public.sub_type
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on fileds
DROP TRIGGER IF EXISTS update_fileds_updated_at ON public.fileds;
CREATE TRIGGER update_fileds_updated_at
BEFORE UPDATE ON public.fileds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
