import { Repository } from "typeorm";
import { Category } from "../entities/category.entity";

export class CategoryRepository extends Repository<Category> {
    async getOrCreate(name: string): Promise<Category> {
        const categoryName = name.trim().toLowerCase();
        const categorySlug = categoryName.replace(/ /g, "-");

        let category = await this.findOne({ where: { slug: categorySlug } });
        if (!category) {
            category = this.create({
                slug: categorySlug,
                name: categoryName,
            });
            await this.save(category);
        }
        return category;
    }
}
