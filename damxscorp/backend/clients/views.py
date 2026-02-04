import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Client, Vehicule, Intervention
from datetime import datetime

# =============================================================================
# FONCTION UTILITAIRE - Trouver ou créer un client
# =============================================================================
def get_or_create_client(nom, prenom="", telephone="", email=""):
    """
    Cherche un client par nom/prénom.
    Si il n'existe pas, on le crée.
    
    ASTUCE : On utilise get_or_create() de Django qui fait tout automatiquement !
    """
    client, created = Client.objects.get_or_create(
        nom=nom.strip().upper(),  # On met en majuscules pour éviter les doublons
        prenom=prenom.strip().capitalize(),  # Première lettre en majuscule
        defaults={
            'telephone': telephone,
            'email': email
        }
    )
    
    # 'created' est True si le client a été créé, False si il existait déjà
    return client


# =============================================================================
# FONCTION UTILITAIRE - Trouver ou créer un véhicule
# =============================================================================
def get_or_create_vehicule(immatriculation, marque="", modele="", annee=None, proprietaire=None):
    """
    Cherche un véhicule par immatriculation.
    Si il n'existe pas, on le crée.
    """
    # On nettoie l'immatriculation (enlève espaces, met en majuscules)
    immat_clean = immatriculation.strip().upper().replace(" ", "")
    
    vehicule, created = Vehicule.objects.get_or_create(
        immatriculation=immat_clean,
        defaults={
            'marque': marque.strip().capitalize(),
            'modele': modele.strip().capitalize(),
            'annee': annee,
            'proprietaire': proprietaire
        }
    )
    
    # Si le véhicule existait déjà mais qu'on a un nouveau propriétaire, on le met à jour
    if not created and proprietaire and vehicule.proprietaire != proprietaire:
        vehicule.proprietaire = proprietaire
        vehicule.save()
    
    return vehicule


# =============================================================================
# API - LISTE DES INTERVENTIONS (pour FullCalendar)
# =============================================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_interventions(request):
    """
    GET  → Renvoie toutes les interventions au format FullCalendar
    POST → Crée une nouvelle intervention
    """
    
    # -------------------------------------------------------------------------
    # GET - Récupérer toutes les interventions
    # -------------------------------------------------------------------------
    if request.method == 'GET':
        interventions = Intervention.objects.select_related('client', 'vehicule').all()
        
        # On transforme les interventions en format FullCalendar
        data = []
        for interv in interventions:
            data.append({
                "id": interv.id,
                "title": interv.titre_calendrier,  # Utilise la propriété du modèle
                "start": interv.date_debut.isoformat(),
                "end": interv.date_fin.isoformat() if interv.date_fin else None,
                
                # extendedProps = toutes les infos supplémentaires pour le panel
                "extendedProps": {
                    "departement": interv.type_rdv,  # ← CORRIGÉ : Envoie le vrai type !
                    "clientName": interv.client.nom,
                    "clientFirstName": interv.client.prenom,
                    "clientPhone": interv.client.telephone,
                    "vehicleModel": f"{interv.vehicule.marque} {interv.vehicule.modele}" if interv.vehicule else "Pas de véhicule",
                    "plate": interv.vehicule.immatriculation if interv.vehicule else "N/A",
                    "description": interv.description,
                    "statut": interv.statut,
                }
            })
        
        return JsonResponse(data, safe=False)
    
    # -------------------------------------------------------------------------
    # POST - Créer une nouvelle intervention
    # -------------------------------------------------------------------------
    elif request.method == 'POST':
        try:
            # 1. On récupère les données envoyées par React
            data = json.loads(request.body)

            # Type de RDV (ATELIER ou ACADEMIE)
            type_rdv = data.get('departement', 'ATELIER')
            
            print(f"🔍 DEBUG - Type RDV reçu : {type_rdv}")  # Pour débugger
            
            # 2. On crée ou récupère le client
            client = get_or_create_client(
                nom=data.get('clientName', 'Inconnu'),
                prenom=data.get('clientFirstName', ''),
                telephone=data.get('clientPhone', ''),
                email=data.get('clientEmail', '')
            )
            
            # 3. On crée ou récupère le véhicule (SEULEMENT si ATELIER)
            vehicule = None
            if type_rdv == 'ATELIER':
                vehicule = get_or_create_vehicule(
                    immatriculation=data.get('plate', 'XX-XXX-XX'),
                    marque=data.get('vehicleBrand', ''),
                    modele=data.get('vehicleModel', ''),
                    annee=data.get('vehicleYear'),
                    proprietaire=client  # On lie le véhicule au client
                )  # ← CORRIGÉ : Parenthèse fermante ajoutée !
            
            # 4. On construit la date/heure complète
            date_str = data.get('date', '')
            time_str = data.get('time', '08:00')
            date_debut = datetime.fromisoformat(f"{date_str}T{time_str}")
            
            # 5. On crée l'intervention avec le type_rdv
            intervention = Intervention.objects.create(
                type_rdv=type_rdv,  # ← CORRIGÉ : On passe le type !
                client=client,
                vehicule=vehicule,  # Peut être None si ACADÉMIE
                date_debut=date_debut,
                description=data.get('description', ''),
                statut='PLANIFIE'  # Par défaut, c'est planifié
            )
            
            print(f"✅ Intervention créée : ID={intervention.id}, Type={intervention.type_rdv}, Véhicule={intervention.vehicule}")
            
            return JsonResponse({
                "status": "success",
                "id": intervention.id,
                "message": "Intervention créée avec succès"
            }, status=201)
            
        except Exception as e:
            # En cas d'erreur, on renvoie un message clair
            print(f"❌ ERREUR : {str(e)}")
            import traceback
            traceback.print_exc()  # Affiche l'erreur complète dans le terminal
            return JsonResponse({
                "status": "error",
                "message": str(e)
            }, status=400)


# =============================================================================
# API - DÉTAIL D'UNE INTERVENTION (Modifier / Supprimer)
# =============================================================================
@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def api_interventions_detail(request, pk):
    """
    GET    → Récupère les détails d'une intervention
    PUT    → Modifie une intervention
    DELETE → Supprime une intervention
    """
    
    # On essaie de récupérer l'intervention
    try:
        intervention = Intervention.objects.select_related('client', 'vehicule').get(pk=pk)
    except Intervention.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Intervention introuvable"}, status=404)
    
    # -------------------------------------------------------------------------
    # GET - Récupérer les détails
    # -------------------------------------------------------------------------
    if request.method == 'GET':
        data = {
            "id": intervention.id,
            "client": {
                "id": intervention.client.id,
                "nom": intervention.client.nom,
                "prenom": intervention.client.prenom,
                "telephone": intervention.client.telephone,
            },
            "vehicule": {
                "id": intervention.vehicule.id if intervention.vehicule else None,
                "immatriculation": intervention.vehicule.immatriculation if intervention.vehicule else None,
                "marque": intervention.vehicule.marque if intervention.vehicule else None,
                "modele": intervention.vehicule.modele if intervention.vehicule else None,
            } if intervention.vehicule else None,
            "date_debut": intervention.date_debut.isoformat(),
            "description": intervention.description,
            "statut": intervention.statut,
            "type_rdv": intervention.type_rdv,
        }
        return JsonResponse(data)
    
    # -------------------------------------------------------------------------
    # DELETE - Supprimer
    # -------------------------------------------------------------------------
    elif request.method == 'DELETE':
        intervention.delete()
        return JsonResponse({"status": "deleted"}, status=204)
    
    # -------------------------------------------------------------------------
    # PUT - Modifier une intervention
    # -------------------------------------------------------------------------
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
        
            print(f"🔄 Modification de l'intervention {pk} avec les données :", data)
        
            # 1. Mettre à jour le type de RDV
            type_rdv = data.get('departement', intervention.type_rdv)
            intervention.type_rdv = type_rdv
        
            # 2. Mettre à jour le client (ou en créer/récupérer un nouveau si les infos changent)
            client = get_or_create_client(
                nom=data.get('clientName', intervention.client.nom),
                prenom=data.get('clientFirstName', intervention.client.prenom),
                telephone=data.get('clientPhone', intervention.client.telephone),
                email=data.get('clientEmail', intervention.client.email)
            )
            intervention.client = client
        
            # 3. Mettre à jour le véhicule (SEULEMENT si ATELIER)
            if type_rdv == 'ATELIER':
                vehicule = get_or_create_vehicule(
                    immatriculation=data.get('plate', intervention.vehicule.immatriculation if intervention.vehicule else 'XX-XXX-XX'),
                    marque=data.get('vehicleBrand', intervention.vehicule.marque if intervention.vehicule else ''),
                    modele=data.get('vehicleModel', intervention.vehicule.modele if intervention.vehicule else ''),
                    annee=data.get('vehicleYear', intervention.vehicule.annee if intervention.vehicule else None),
                    proprietaire=client
                )
                intervention.vehicule = vehicule
            else:
                # Si on passe de ATELIER à ACADÉMIE, on vire le véhicule
                intervention.vehicule = None
        
            # 4. Mettre à jour la date/heure
            if data.get('date') and data.get('time'):
                date_str = data.get('date')
                time_str = data.get('time')
                intervention.date_debut = datetime.fromisoformat(f"{date_str}T{time_str}")
        
            # 5. Mettre à jour la description et le statut
            if 'description' in data:
                intervention.description = data.get('description', '')
        
            if 'statut' in data:
                intervention.statut = data.get('statut', intervention.statut)
        
            # 6. Sauvegarder les modifications
            intervention.save()
        
            print(f"✅ Intervention {pk} modifiée avec succès !")
        
            return JsonResponse({
                "status": "success",
                "id": intervention.id,
                "message": "Intervention modifiée avec succès"
            }, status=200)
        
        except Exception as e:
            print(f"❌ ERREUR lors de la modification : {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                "status": "error",
                "message": str(e)
            }, status=400)