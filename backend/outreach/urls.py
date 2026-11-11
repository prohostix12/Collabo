from django.urls import path

from . import views

urlpatterns = [
    path('templates/', views.TemplateList.as_view()),
    path('templates/<int:pk>/', views.TemplateDetail.as_view()),
    path('contacts/', views.ContactList.as_view()),
    path('contacts/import/', views.ContactImport.as_view()),
    path('contacts/bulk/', views.ContactBulk.as_view()),
    path('contacts/<int:pk>/', views.ContactDetail.as_view()),
    path('preview/', views.Preview.as_view()),
    path('test/', views.TestSend.as_view()),
    path('limits/', views.Limits.as_view()),
    path('campaigns/', views.CampaignList.as_view()),
    path('campaigns/<int:pk>/', views.CampaignDetail.as_view()),
    path('campaigns/<int:pk>/<str:action>/', views.CampaignAction.as_view()),
]
