import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { DamageProfile } from "../types";

export interface BuildIdentity {
 profile: DamageProfile;
 accentRgb: string;
 accentLabel: string;
}

const profileAccents: Record<DamageProfile, { rgb: string; label: string }> = {
 burn: { rgb: "255, 136, 86", label: "Burn / Blaze" },
 frost: { rgb: "98, 220, 255", label: "Frost / Vortex" },
 shock: { rgb: "113, 151, 255", label: "Power Surge / Shock" },
 "unstable-bomber": { rgb: "255, 82, 192", label: "Unstable Bomber" },
 kinetic: { rgb: "229, 214, 176", label: "Kinetic / Physical" },
 mixed: { rgb: "137, 108, 255", label: "Hybrid / Mixed" },
};

const BuildIdentityContext = createContext<BuildIdentity>({
 profile: "kinetic",
 accentRgb: "137, 108, 255",
 accentLabel: "Kinetic / Physical",
});

export function BuildIdentityProvider({
 profile,
 children,
}: {
 profile: DamageProfile;
 children: ReactNode;
}) {
 const identity = useMemo<BuildIdentity>(() => {
  const acc = profileAccents[profile] ?? profileAccents.kinetic;
  return { profile, accentRgb: acc.rgb, accentLabel: acc.label };
 }, [profile]);

 return (
  <BuildIdentityContext.Provider value={identity}>
   {children}
  </BuildIdentityContext.Provider>
 );
}

export function useBuildIdentity(): BuildIdentity {
 return useContext(BuildIdentityContext);
}
