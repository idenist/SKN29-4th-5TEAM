from django.contrib import admin

from .models import CommunityPost, Comment


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    fields = ("author", "content", "created_at")
    readonly_fields = ("created_at",)
    can_delete = True


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "category", "view_count", "created_at")
    list_filter = ("category", "created_at")
    search_fields = ("title", "content", "author__email", "author__username")
    readonly_fields = ("view_count", "created_at", "updated_at")
    date_hierarchy = "created_at"
    inlines = [CommentInline]
    ordering = ("-created_at",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "author", "short_content", "created_at")
    list_filter = ("created_at",)
    search_fields = ("content", "author__email", "post__title")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)

    def short_content(self, obj):
        return obj.content[:40] + ("..." if len(obj.content) > 40 else "")

    short_content.short_description = "내용"